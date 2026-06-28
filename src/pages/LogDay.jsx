import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getMoonInfo } from '../utils/moonPhase'
import { SA_FISH_SPECIES, BAIT_OPTIONS, TIDE_TYPES, SA_LOCATIONS } from '../constants'

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

  const [moonInfo, setMoonInfo] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (form.date) {
      setMoonInfo(getMoonInfo(new Date(form.date)))
    }
  }, [form.date])

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
