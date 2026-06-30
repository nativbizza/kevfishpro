import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { getMoonInfo } from '../utils/moonPhase'
import { SA_FISH_SPECIES, BAIT_OPTIONS, TIDE_TYPES, SA_LOCATIONS } from '../constants'
import { bearingToCompass } from '../hooks/useStormglass'
import { locationSlug } from '../hooks/useConditionsCache'
// nearestT4FLocation removed — location now comes from localStorage saved location

const LS_KEY = 'kevfishpro_location'

function getSavedLocation() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
}

async function getSavedLocationWithFallback(uid) {
  // 1. localStorage (instant)
  const local = getSavedLocation()
  if (local) return local
  // 2. Firestore fallback
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (snap.exists() && snap.data().savedLocation) {
      const loc = snap.data().savedLocation
      localStorage.setItem(LS_KEY, JSON.stringify(loc)) // cache it
      return loc
    }
  } catch { /* ignore */ }
  return null
}

async function getConditionsSnapshot(slug) {
  if (!slug) return null
  try {
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 4000))
    const snap = await Promise.race([getDoc(doc(db, 'conditions', slug)), timeout])
    if (!snap || !snap.exists?.()) return null
    const d = snap.data()
    // New structure: { weather: { data, fetchedAt }, tides: { data, fetchedAt } }
    const marine   = d.weather?.data   ?? d.marine   ?? null
    const tides    = d.tides?.data     ?? d.tides    ?? []
    const fetchedAt = d.weather?.fetchedAt ?? d.tides?.fetchedAt ?? d.fetchedAt ?? null
    return { tides, marine, fetchedAt }
  } catch {
    return null
  }
}

// Find the best matching SA_LOCATIONS entry for a T4F location name
function matchToSALocation(t4fName) {
  // Exact match first
  if (SA_LOCATIONS.includes(t4fName)) return t4fName
  // SA_LOCATIONS entry contains the T4F name (e.g. "Cape Town (Kalk Bay)" contains "Kalk Bay")
  const containing = SA_LOCATIONS.find((l) => l.includes(t4fName))
  if (containing) return containing
  // T4F name contains an SA_LOCATIONS entry (e.g. "Port Elizabeth" inside "Port Elizabeth (Gqeberha)")
  const contained = SA_LOCATIONS.find((l) => t4fName.includes(l.replace(/ \(.*\)/, '')))
  if (contained) return contained
  return null  // will fall back to custom
}

// Infer tide type from today's tide extremes
function inferTideType(tides) {
  if (!tides?.length) return ''
  const now = new Date()
  const past = [...tides].reverse().find((t) => new Date(t.time) <= now)
  const next = tides.find((t) => new Date(t.time) > now)
  if (!past || !next) return ''
  if (past.type === 'low'  && next.type === 'high') return 'Incoming'
  if (past.type === 'high' && next.type === 'low')  return 'Outgoing'
  return ''
}

// Current approx tide height — interpolate between surrounding extremes
function currentTideHeight(tides) {
  if (!tides?.length) return ''
  const now = new Date()
  const past = [...tides].reverse().find((t) => new Date(t.time) <= now)
  const next = tides.find((t) => new Date(t.time) > now)
  if (!past || !next) return ''
  const tPast = new Date(past.time).getTime()
  const tNext = new Date(next.time).getTime()
  const frac = (now.getTime() - tPast) / (tNext - tPast)
  const height = past.height + (next.height - past.height) * frac
  return height.toFixed(1)
}

// Build a surf conditions summary string from marine data
function buildSurfString(marine) {
  if (!marine) return ''
  const parts = []
  if (marine.waveHeight !== '–') parts.push(`${marine.waveHeight}m swell`)
  if (marine.wavePeriod  !== '–') parts.push(`${marine.wavePeriod}s period`)
  if (marine.windSpeed   !== '–') {
    const dir = marine.windDirection !== '–' ? ` ${bearingToCompass(parseFloat(marine.windDirection))}` : ''
    parts.push(`${marine.windSpeed} m/s${dir} wind`)
  }
  if (marine.waterTemp   !== '–') parts.push(`${marine.waterTemp}°C water`)
  return parts.join(', ')
}

const defaultCatch = () => ({ species: '', qty: 1, bait: '' })

const emptyForm = () => {
  const now = new Date()
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
  return {
    date: localIso,
    location: '',
    locationCustom: '',
    catches: [defaultCatch()],
    tideHeight: '',
    tideType: '',
    surfConditions: '',
    comments: '',
  }
}

export default function LogDay({ onSave }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const { user } = useAuth()
  const isEditing = !!state?.session

  const [form, setForm] = useState(() => {
    if (isEditing) {
      const s = state.session
      const d = s.date instanceof Date ? s.date : new Date(s.date)
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      return {
        date: localIso,
        location: SA_LOCATIONS.includes(s.location) ? s.location : 'Other',
        locationCustom: SA_LOCATIONS.includes(s.location) ? '' : s.location,
        catches: s.catches?.length ? s.catches : [defaultCatch()],
        tideHeight: s.tideHeight ?? '',
        tideType: s.tideType ?? '',
        surfConditions: s.surfConditions ?? '',
        comments: s.comments ?? '',
      }
    }
    return emptyForm()
  })

  const [moonInfo, setMoonInfo]       = useState(null)
  const [saving, setSaving]           = useState(false)
  const [errors, setErrors]           = useState({})
  const [autoPopStatus, setAutoPopStatus] = useState(null) // null | 'loading' | 'done' | { error: string }

  useEffect(() => {
    if (form.date) setMoonInfo(getMoonInfo(new Date(form.date)))
  }, [form.date])

  // Auto-populate location + conditions from saved location
  // Depends on user?.uid so it re-runs once auth is confirmed
  useEffect(() => {
    if (isEditing) return
    if (!user) return  // wait for auth before hitting Firestore

    const run = async () => {
      const saved = await getSavedLocationWithFallback(user?.uid)
      if (!saved) {
        setAutoPopStatus(null)
        return
      }

      setAutoPopStatus('loading')
      try {
        const slug  = locationSlug(saved.name)
        const cache = await getConditionsSnapshot(slug)

        if (!cache?.marine) {
          setAutoPopStatus({ error: `No conditions data for ${saved.name} yet — open the Home page first to load today's data` })
          return
        }

        const tideType   = inferTideType(cache.tides)
        const tideHeight = currentTideHeight(cache.tides)
        const surfStr    = buildSurfString(cache.marine)
        const matched    = matchToSALocation(saved.name)

        setForm((f) => ({
          ...f,
          ...(matched
            ? { location: matched }
            : { location: 'Other', locationCustom: saved.name }),
          ...(tideType   ? { tideType }   : {}),
          ...(tideHeight ? { tideHeight } : {}),
          ...(surfStr    ? { surfConditions: surfStr } : {}),
        }))
        setAutoPopStatus('done')
      } catch (err) {
        setAutoPopStatus({ error: `Auto-population not available — ${err.message}` })
      }
    }

    run()
  }, [isEditing, user?.uid])

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const setCatch = (i, field, value) => {
    const catches = [...form.catches]
    catches[i] = { ...catches[i], [field]: value }
    setForm((f) => ({ ...f, catches }))
  }

  const addCatch = () => setForm((f) => ({ ...f, catches: [...f.catches, defaultCatch()] }))

  const removeCatch = (i) =>
    setForm((f) => ({ ...f, catches: f.catches.filter((_, idx) => idx !== i) }))

  const validate = () => {
    const e = {}
    if (!form.date) e.date = 'Required'
    const loc = form.location === 'Other' ? form.locationCustom : form.location
    if (!loc) e.location = 'Required'
    form.catches.forEach((c, i) => {
      if (!c.species) e[`species_${i}`] = 'Select a species'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const location =
        form.location === 'Other' ? form.locationCustom : form.location

      // Best-effort — don't let a slow/failed cache read block the save
      let conditions = null
      try {
        const saved = await getSavedLocationWithFallback(user?.uid)
        const slug = saved ? locationSlug(saved.name) : null
        conditions = await getConditionsSnapshot(slug)
      } catch { /* ignore */ }

      await onSave(
        {
          date: form.date,
          location,
          catches: form.catches,
          tideHeight: form.tideHeight ? parseFloat(form.tideHeight) : null,
          tideType: form.tideType,
          surfConditions: form.surfConditions,
          moonPhase: moonInfo?.phaseName ?? '',
          moonIllumination: moonInfo?.illuminationPercent ?? 0,
          comments: form.comments,
          ...(conditions ? { conditions } : {}),
        },
        isEditing ? state.session.id : null
      )
      navigate('/history')
    } catch (err) {
      alert('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = (err) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean-400 ${
      err ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    }`

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-ocean-800 mb-6">
        {isEditing ? '✏️ Edit Session' : '🎣 Log Fishing Day'}
      </h1>

      {/* Auto-populate banner */}
      {!isEditing && autoPopStatus === 'loading' && (
        <div className="flex items-center gap-2 bg-ocean-50 border border-ocean-100 rounded-xl px-4 py-2.5 text-xs text-ocean-600 animate-pulse">
          <span>📍</span><span>Detecting location and loading conditions…</span>
        </div>
      )}
      {!isEditing && autoPopStatus === 'done' && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-xs text-emerald-700">
          <span>✅</span><span>Location and conditions auto-populated — tap any field to change</span>
        </div>
      )}
      {!isEditing && autoPopStatus?.error && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 text-xs text-amber-700">
          <span className="shrink-0">⚠️</span><span>{autoPopStatus.error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Date & Time */}
        <Section title="📅 Date & Time">
          <div>
            <label className="label">Date & Time</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={inputCls(errors.date)}
            />
            {errors.date && <p className="err">{errors.date}</p>}
          </div>
          {moonInfo && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-indigo-50 rounded-lg px-4 py-2">
              <span className="text-2xl">{moonInfo.phaseEmoji}</span>
              <span>
                <strong>{moonInfo.phaseName}</strong> — {moonInfo.illuminationPercent}% illuminated
              </span>
            </div>
          )}
        </Section>

        {/* Location */}
        <Section title="📍 Location">
          <div>
            <label className="label">Fishing Spot</label>
            <select
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              className={inputCls(errors.location)}
            >
              <option value="">Select location…</option>
              {SA_LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            {errors.location && <p className="err">{errors.location}</p>}
          </div>
          {form.location === 'Other' && (
            <div>
              <label className="label">Custom Location</label>
              <input
                type="text"
                placeholder="e.g. Olifantsbos, Cape Point"
                value={form.locationCustom}
                onChange={(e) => set('locationCustom', e.target.value)}
                className={inputCls(errors.location)}
              />
            </div>
          )}
        </Section>

        {/* Catches */}
        <Section title="🐟 What Did You Catch?">
          <div className="space-y-4">
            {form.catches.map((c, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Catch #{i + 1}</span>
                  {form.catches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCatch(i)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="label">Species</label>
                    <select
                      value={c.species}
                      onChange={(e) => setCatch(i, 'species', e.target.value)}
                      className={inputCls(errors[`species_${i}`])}
                    >
                      <option value="">Select species…</option>
                      {SA_FISH_SPECIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors[`species_${i}`] && <p className="err">{errors[`species_${i}`]}</p>}
                  </div>
                  <div>
                    <label className="label">Qty Caught</label>
                    <input
                      type="number"
                      min="0"
                      value={c.qty}
                      onChange={(e) => setCatch(i, 'qty', parseInt(e.target.value) || 0)}
                      className={inputCls()}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="label">Bait Used</label>
                    <select
                      value={c.bait}
                      onChange={(e) => setCatch(i, 'bait', e.target.value)}
                      className={inputCls()}
                    >
                      <option value="">Select bait…</option>
                      {BAIT_OPTIONS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addCatch}
              className="text-sm text-ocean-600 hover:text-ocean-800 font-medium"
            >
              + Add another species
            </button>
          </div>
        </Section>

        {/* Conditions */}
        <Section title="🌊 Conditions">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Tide Height (m)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                placeholder="e.g. 1.4"
                value={form.tideHeight}
                onChange={(e) => set('tideHeight', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div>
              <label className="label">Tide Type</label>
              <select
                value={form.tideType}
                onChange={(e) => set('tideType', e.target.value)}
                className={inputCls()}
              >
                <option value="">Select…</option>
                {TIDE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Surf / Wind Conditions</label>
            <input
              type="text"
              placeholder="e.g. 1–2m swell, SE wind 15 knots, clear"
              value={form.surfConditions}
              onChange={(e) => set('surfConditions', e.target.value)}
              className={inputCls()}
            />
          </div>
        </Section>

        {/* Comments */}
        <Section title="📝 Comments">
          <textarea
            rows={3}
            placeholder="Any notes about the session…"
            value={form.comments}
            onChange={(e) => set('comments', e.target.value)}
            className={inputCls() + ' resize-none'}
          />
        </Section>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-ocean-700 hover:bg-ocean-800 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEditing ? 'Update Session' : 'Save Session'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
      <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}
