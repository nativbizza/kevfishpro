import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useConditionsCache } from '../hooks/useConditionsCache'
import { bearingToCompass } from '../hooks/useStormglass'
import { useInsights } from '../hooks/useInsights'
import { useSessions } from '../hooks/useSessions'
import { nearestT4FLocation, PROVINCES, locationsByProvince } from '../utils/tides4fishing'
import { overallRatingLabel } from '../utils/conditionInsights'
import { Stars } from '../components/InsightCard'
import Modal from '../components/Modal'

export default function Home() {
  const { coords: gpsCoords, loading: locLoading, error: locError, refresh } = useGeolocation()
  const [manualLocation, setManualLocation] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [activeInsight, setActiveInsight] = useState(null)
  const [showConditions, setShowConditions] = useState(false)

  const coords = manualLocation ?? gpsCoords
  const { tides, marine, fetchedAt, loading: tidesLoading, error: tidesError, source, refresh: refreshConditions } = useConditionsCache(coords)
  const { sessions } = useSessions()
  const nearest = coords ? nearestT4FLocation(coords.lat, coords.lng) : null
  const province = manualLocation?.province ?? nearest?.province ?? null
  const { solunar, overallScore, insights, tideType } = useInsights({ coords, marine, tides, sessions, province })
  const rating = overallRatingLabel(overallScore)

  const locationLabel = manualLocation
    ? `${manualLocation.name}, ${manualLocation.province}`
    : nearest ? `${nearest.name} (GPS)` : 'Detecting…'

  const handleManualSelect = (loc) => {
    setManualLocation({ lat: loc.lat, lng: loc.lng, name: loc.name, province: loc.province })
    setShowPicker(false); setSelectedProvince(null)
  }
  const handleUseGPS = () => {
    setManualLocation(null); setShowPicker(false); setSelectedProvince(null); refresh()
  }

  // Top 6 species by score
  const topSpecies = [...(insights.species ?? [])].sort((a, b) => b.score - a.score).slice(0, 6)

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-ocean-800 rounded-2xl px-5 py-5 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold">🎣 KevFishPro</h1>
            <p className="text-ocean-300 text-xs mt-0.5">
              Your SA fishing companion ·{' '}
              <a href="https://www.instagram.com/kpg_oira/" target="_blank" rel="noopener noreferrer"
                className="text-ocean-400 hover:text-white underline underline-offset-2 transition">
                A kpg_oira initiative
              </a>
            </p>
          </div>
          <button
            onClick={() => setActiveInsight({
              id: 'rating-explainer',
              source: 'conditions',
              icon: '📊',
              title: 'Conditions Rating',
              summary: 'How the overall score is calculated',
              detail: `The Conditions Rating (0–10) is a quick read on how good it is to fish right now.\n\nIt blends two factors:\n\n• Conditions score — rates the current tide type, wave height, wind speed, and water temperature against ideal fishing ranges.\n\n• Moon phase rating — new and full moons score highest (5/5) because the gravitational pull is strongest, driving the biggest tidal swings and most aggressive feeding. Quarter moons score lowest (2/5).\n\nThe moon factor is weighted double because it has the single biggest influence on fish feeding behaviour.\n\nRatings:\n🔴 0–3 Poor — tough conditions\n🟡 4–5 Fair — fishable but not ideal\n🟢 6–7 Good — solid session likely\n🔵 8–10 Excellent — prime conditions`,
            })}
            className={`px-3 py-1.5 rounded-xl text-center ${rating.bg} border ${rating.border} hover:opacity-80 transition`}
          >
            <p className={`text-xs font-bold ${rating.color}`}>{rating.label}</p>
            <p className={`text-lg font-black ${rating.color}`}>{overallScore}/10</p>
            <p className={`text-xs ${rating.color} opacity-70`}>Conditions Rating ⓘ</p>
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between bg-ocean-700 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-xs text-ocean-300">Location</p>
            <p className="font-semibold text-sm">
              {locLoading && !manualLocation ? '📍 Detecting…' : locationLabel}
            </p>
          </div>
          <button
            onClick={() => { setShowPicker(!showPicker); setSelectedProvince(null) }}
            className="text-xs bg-ocean-600 hover:bg-ocean-500 px-3 py-1.5 rounded-lg font-medium transition"
          >
            Change
          </button>
        </div>
        {locError && !manualLocation && (
          <p className="text-xs text-amber-300 mt-2">⚠️ Location denied — select manually</p>
        )}
      </div>

      {/* ── Conditions data banner ────────────────────────────────────────── */}
      <ConditionsBanner fetchedAt={fetchedAt} loading={tidesLoading} error={tidesError} source={source} onRefresh={refreshConditions} />

      {/* ── Location picker ──────────────────────────────────────────────── */}
      {showPicker && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          {!selectedProvince ? (
            <>
              <p className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">Select Province</p>
              <button onClick={handleUseGPS} className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-ocean-700 bg-ocean-50 hover:bg-ocean-100 mb-2 transition">
                📍 Use my GPS location
              </button>
              {PROVINCES.map((p) => (
                <button key={p} onClick={() => setSelectedProvince(p)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition flex justify-between items-center">
                  <span>{p}</span>
                  <span className="text-gray-400 text-xs">{locationsByProvince(p).length} spots →</span>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => setSelectedProvince(null)} className="text-ocean-600 text-sm font-medium">← Back</button>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-gray-800 text-sm">{selectedProvince}</span>
              </div>
              {locationsByProvince(selectedProvince).map((loc) => (
                <button key={loc.url} onClick={() => handleManualSelect(loc)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${manualLocation?.name === loc.name ? 'bg-ocean-100 text-ocean-800 font-semibold' : 'hover:bg-gray-50 text-gray-700'}`}>
                  {loc.name}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — CURRENT CONDITIONS
      ══════════════════════════════════════════════════════════════════ */}
      <SectionHeader title="🌊 Current Conditions" />

      <button
        onClick={() => setShowConditions(true)}
        className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-left hover:shadow-md transition"
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700">
            {nearest ? nearest.name : 'Your Location'}
          </span>
          <span className="text-xs text-ocean-600 font-medium">Full details →</span>
        </div>

        {tidesLoading ? (
          <p className="text-sm text-gray-400 animate-pulse">Loading…</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tide */}
            <CondStat
              emoji={tideType === 'Incoming' ? '🔼' : tideType === 'Outgoing' ? '🔽' : '🌊'}
              label="Tide"
              value={tideType ?? '–'}
              sub={nextTideStr(tides)}
            />
            {/* Swell */}
            <CondStat
              emoji="🌀"
              label="Swell"
              value={marine ? `${marine.waveHeight}m` : '–'}
              sub={marine ? `${marine.wavePeriod}s · ${bearingToCompass(marine.waveDirection)}` : ''}
            />
            {/* Wind */}
            <CondStat
              emoji="💨"
              label="Wind"
              value={marine ? `${marine.windSpeed} m/s` : '–'}
              sub={marine ? bearingToCompass(marine.windDirection) : ''}
            />
            {/* Water temp */}
            <CondStat
              emoji="🌡️"
              label="Water Temp"
              value={marine ? `${marine.waterTemp}°C` : '–'}
              sub={marine ? tempNote(parseFloat(marine.waterTemp)) : ''}
            />
            {/* Moon */}
            <CondStat
              emoji="🌙"
              label="Moon"
              value={solunar?.moonLabel?.split(' — ')[0] ?? '–'}
              sub={solunar ? `${solunar.moonIllum}% lit` : ''}
            />
            {/* Solunar */}
            <CondStat
              emoji={solunar?.activePeriod ? '🟢' : '🕐'}
              label="Solunar"
              value={solunar?.activePeriod ? 'Active now' : solunar?.nextPeriod ? `Next ${solunar.minsToNext}m` : '–'}
              sub={solunar?.activePeriod?.label ?? solunar?.nextPeriod?.label ?? ''}
            />
          </div>
        )}
      </button>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — SPECIES INSIGHTS
      ══════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="🐟 Species Insights"
        sub="Ranked by how well current conditions match each species. Based on SA fishing knowledge."
      />

      <div className="space-y-2.5">
        {topSpecies.map((s) => (
          <SpeciesCard key={s.id} insight={s} onClick={() => setActiveInsight(s)} />
        ))}
        {insights.myLogs?.length > 0 && insights.myLogs[0].id !== 'mylogs-empty' && (
          <div className="mt-1">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">From Your Logs</p>
            {insights.myLogs.map((m) => (
              <button key={m.id} onClick={() => setActiveInsight(m)}
                className="w-full text-left bg-amber-50 border border-amber-100 rounded-xl p-3.5 mb-2 hover:shadow-sm transition">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">{m.title}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{m.summary}</p>
                  </div>
                  <span className="ml-auto text-amber-300">›</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — TIMEFRAME INSIGHTS
      ══════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        title="⏰ Timeframe Insights"
        sub="Best fishing windows for today based on solunar theory, sun and moon positions."
      />

      <TimeframeInsights solunar={solunar} onPeriodTap={(p) => setActiveInsight({
        id: 'timeframe-detail',
        source: 'solunar',
        icon: p.type === 'major' ? '🌕' : '🌙',
        title: p.label,
        summary: `${p.type === 'major' ? 'Major' : 'Minor'} feeding period at ${p.peakStr}`,
        detail: p.type === 'major'
          ? `This is a MAJOR solunar period — the strongest feeding window of the day.\n\nCentered at ${p.peakStr}, this window lasts approximately 2 hours (from 1 hour before to 1 hour after the peak).\n\nMajor periods occur when the moon is directly overhead or underfoot. The gravitational pull is at its strongest, triggering biting behaviour across most fish species.`
          : `This is a MINOR solunar period — a secondary feeding window.\n\nCentered at ${p.peakStr}, this window lasts approximately 1 hour.\n\nMinor periods occur at moonrise and moonset. Fish activity increases but typically less dramatically than major periods. Still well worth fishing.`,
        periods: solunar?.periods,
      })} />

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <Modal open={showConditions} onClose={() => setShowConditions(false)} title="🌊 Conditions Detail">
        <ConditionsDetail marine={marine} tides={tides} solunar={solunar} tideType={tideType} nearest={nearest} />
      </Modal>

      <Modal
        open={!!activeInsight}
        onClose={() => setActiveInsight(null)}
        title={activeInsight ? `${activeInsight.icon} ${activeInsight.title}` : ''}
      >
        {activeInsight && <InsightDetail insight={activeInsight} />}
      </Modal>
    </div>
  )
}

// ── Timeframe Insights component ──────────────────────────────────────────────

function TimeframeInsights({ solunar, onPeriodTap }) {
  if (!solunar) return <p className="text-sm text-gray-400 text-center py-6">Loading solunar data…</p>

  const now = new Date()

  const windows = [
    solunar.dawn    && { key: 'dawn',    emoji: '🌅', label: 'Nautical Dawn',  time: solunar.dawn,    type: 'sun',   note: 'Excellent — low light, fish feeding actively near surface' },
    solunar.sunrise && { key: 'sunrise', emoji: '☀️', label: 'Sunrise',        time: solunar.sunrise, type: 'sun',   note: 'Good — transition period, predators active' },
    ...solunar.periods.map((p) => ({
      key:   p.label,
      emoji: p.type === 'major' ? '🔵' : '🟡',
      label: p.label,
      time:  p.peakStr,
      type:  p.type,
      note:  p.type === 'major' ? 'Major feeding window (±60 min)' : 'Minor feeding window (±30 min)',
      period: p,
    })),
    solunar.sunset  && { key: 'sunset',  emoji: '🌇', label: 'Sunset',         time: solunar.sunset,  type: 'sun',   note: 'Excellent — prime feeding time for most species' },
    solunar.dusk    && { key: 'dusk',    emoji: '🌆', label: 'Nautical Dusk',  time: solunar.dusk,    type: 'sun',   note: 'Good — last light feeding window' },
  ].filter(Boolean).sort((a, b) => a.time.localeCompare(b.time))

  const nextWindow = solunar.activePeriod
    ? null
    : solunar.nextPeriod
    ? { label: solunar.nextPeriod.label, mins: solunar.minsToNext, type: solunar.nextPeriod.type }
    : null

  return (
    <div className="space-y-3">
      {/* Active period banner */}
      {solunar.activePeriod && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl animate-pulse">🟢</span>
          <div>
            <p className="font-bold text-emerald-800 text-sm">Active: {solunar.activePeriod.label}</p>
            <p className="text-xs text-emerald-600">{solunar.activePeriod.type === 'major' ? 'Major feeding period — fish now!' : 'Minor feeding period — good activity'}</p>
          </div>
        </div>
      )}

      {/* Next period countdown */}
      {nextWindow && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-bold text-indigo-800 text-sm">{nextWindow.label} in {nextWindow.mins} min</p>
            <p className="text-xs text-indigo-600">{nextWindow.type === 'major' ? 'Major period coming up — prepare your gear' : 'Minor period approaching'}</p>
          </div>
        </div>
      )}

      {/* Today's windows */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-2">Today's Windows</p>
        {windows.map((w, i) => {
          const isPast = w.time < now.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
          const isActive = w.period && solunar.activePeriod?.label === w.period.label
          return (
            <button
              key={w.key}
              onClick={() => w.period && onPeriodTap(w.period)}
              disabled={!w.period}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 border-t border-gray-50 transition
                ${isActive ? 'bg-emerald-50' : isPast ? 'opacity-50' : 'hover:bg-gray-50'}
                ${w.period ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <span className="text-xl w-7 text-center shrink-0">{w.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold ${isActive ? 'text-emerald-700' : 'text-gray-800'}`}>{w.label}</p>
                  {w.type === 'major' && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">major</span>
                  )}
                  {w.type === 'minor' && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">minor</span>
                  )}
                  {isActive && <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">active</span>}
                </div>
                <p className="text-xs text-gray-400 truncate">{w.note}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isActive ? 'text-emerald-600' : 'text-gray-600'}`}>{w.time}</p>
                {w.period && <span className="text-xs text-gray-300">›</span>}
              </div>
            </button>
          )
        })}
      </div>

      {/* Moon summary */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">🌙</span>
        <div>
          <p className="font-semibold text-indigo-800 text-sm">{solunar.moonLabel}</p>
          <p className="text-xs text-indigo-600">
            {solunar.moonIllum}% illuminated · Rise {solunar.moonrise ?? '–'} · Set {solunar.moonset ?? '–'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Conditions detail popup ───────────────────────────────────────────────────

function ConditionsDetail({ marine, tides, solunar, tideType, nearest }) {
  return (
    <div className="space-y-5">
      {/* Tide extremes */}
      {tides?.length > 0 && (
        <DetailSection title="Today's Tides">
          {tides.map((t, i) => {
            const time = new Date(t.time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
            const isHigh = t.type === 'high'
            return (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 text-sm">
                <span className="flex items-center gap-2">
                  {isHigh ? '🔼' : '🔽'}
                  <span className={isHigh ? 'text-ocean-700 font-medium' : 'text-gray-500'}>
                    {isHigh ? 'High Tide' : 'Low Tide'}
                  </span>
                </span>
                <span><strong>{t.height?.toFixed(2)}m</strong><span className="text-gray-400 ml-2">{time}</span></span>
              </div>
            )
          })}
          {tideType && (
            <p className="text-xs text-ocean-600 bg-ocean-50 rounded px-2 py-1 mt-2 inline-block">
              Currently: {tideType} tide
            </p>
          )}
        </DetailSection>
      )}

      {/* Marine */}
      {marine && (
        <DetailSection title="Marine Conditions">
          <div className="grid grid-cols-2 gap-2.5">
            <CondBox emoji="🌊" label="Wave Height"     value={`${marine.waveHeight}m`} />
            <CondBox emoji="⏱️" label="Wave Period"     value={`${marine.wavePeriod}s`} />
            <CondBox emoji="🧭" label="Swell Direction" value={bearingToCompass(marine.waveDirection)} />
            <CondBox emoji="💨" label="Wind Speed"      value={`${marine.windSpeed} m/s`} />
            <CondBox emoji="🧭" label="Wind Direction"  value={bearingToCompass(marine.windDirection)} />
            <CondBox emoji="🌡️" label="Water Temp"     value={`${marine.waterTemp}°C`} />
          </div>
        </DetailSection>
      )}

      {/* Sun times */}
      {solunar?.sunrise && (
        <DetailSection title="Sun Times">
          <div className="grid grid-cols-2 gap-2">
            <TimeRow emoji="🌅" label="Dawn"    value={solunar.dawn}    />
            <TimeRow emoji="☀️" label="Sunrise" value={solunar.sunrise} />
            <TimeRow emoji="🌇" label="Sunset"  value={solunar.sunset}  />
            <TimeRow emoji="🌆" label="Dusk"    value={solunar.dusk}    />
          </div>
        </DetailSection>
      )}

      {/* Solunar periods */}
      {solunar?.periods?.length > 0 && (
        <DetailSection title="Solunar Feeding Periods">
          {solunar.periods.map((p, i) => {
            const now = new Date()
            const isActive = now >= p.start && now <= p.end
            return (
              <div key={i} className={`flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0 text-sm ${isActive ? 'text-emerald-700' : ''}`}>
                <div className="flex items-center gap-2">
                  {isActive && <span className="w-2 h-2 bg-emerald-500 rounded-full" />}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.type === 'major' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{p.type}</span>
                  <span className="font-medium">{p.label}</span>
                </div>
                <span className="text-gray-500">{p.peakStr}</span>
              </div>
            )
          })}
        </DetailSection>
      )}

      {/* Moon */}
      {solunar && (
        <DetailSection title="Moon">
          <div className="flex items-center gap-3 py-1">
            <span className="text-3xl">🌙</span>
            <div>
              <p className="font-semibold text-gray-800">{solunar.moonLabel}</p>
              <p className="text-sm text-gray-500">{solunar.moonIllum}% illuminated · Rise {solunar.moonrise} · Set {solunar.moonset}</p>
            </div>
          </div>
        </DetailSection>
      )}

      {/* tides4fishing link */}
      {nearest && (
        <a href={nearest.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between bg-ocean-700 hover:bg-ocean-800 text-white px-4 py-3.5 rounded-xl transition font-semibold text-sm mt-2">
          <span>📋 Open {nearest.name} on tides4fishing</span>
          <span className="text-ocean-300 text-xs">Full forecast →</span>
        </a>
      )}
    </div>
  )
}

// ── Insight detail popup ──────────────────────────────────────────────────────

function InsightDetail({ insight }) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4">
        {insight.detail}
      </div>
      {insight.reasons?.length > 0 && (
        <DetailSection title="Conditions Match">
          {insight.reasons.map((r, i) => <p key={i} className="text-sm py-1.5 border-b border-gray-50 last:border-0">{r}</p>)}
        </DetailSection>
      )}
      {insight.tips?.length > 0 && (
        <DetailSection title="Fishing Tips">
          {insight.tips.map((t, i) => (
            <p key={i} className="text-sm text-gray-600 py-1.5 border-b border-gray-50 last:border-0 flex gap-2">
              <span className="text-ocean-400 shrink-0">•</span>{t}
            </p>
          ))}
        </DetailSection>
      )}
      {insight.bait?.length > 0 && (
        <DetailSection title="Best Baits">
          <div className="flex flex-wrap gap-1.5">
            {insight.bait.map((b) => <span key={b} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-1 rounded-full">{b}</span>)}
          </div>
        </DetailSection>
      )}
      {insight.bestLocations?.length > 0 && (
        <DetailSection title="Top SA Spots">
          <div className="flex flex-wrap gap-1.5">
            {insight.bestLocations.map((l) => <span key={l} className="text-xs bg-ocean-50 text-ocean-700 border border-ocean-100 px-2 py-1 rounded-full">📍 {l}</span>)}
          </div>
        </DetailSection>
      )}
      {insight.periods?.length > 0 && (
        <DetailSection title="All Periods Today">
          {insight.periods.map((p, i) => (
            <div key={i} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.type === 'major' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{p.type}</span>
                {p.label}
              </div>
              <span className="text-gray-500">{p.peakStr}</span>
            </div>
          ))}
        </DetailSection>
      )}
    </div>
  )
}

// ── Reusable small components ─────────────────────────────────────────────────

function SectionHeader({ title, sub }) {
  return (
    <div>
      <h2 className="font-bold text-gray-800 text-base">{title}</h2>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function CondStat({ emoji, label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2.5">
      <p className="text-xs text-gray-400 mb-0.5">{emoji} {label}</p>
      <p className="font-bold text-gray-800 text-sm">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function SpeciesCard({ insight, onClick }) {
  const pct = Math.round((insight.score / (insight.maxScore ?? 7)) * 100)
  const barColor = pct >= 70 ? 'bg-emerald-400' : pct >= 45 ? 'bg-amber-400' : 'bg-red-300'

  return (
    <button onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm hover:shadow-md transition active:scale-[0.98]">
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0">{insight.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <p className="font-semibold text-gray-800 text-sm">{insight.title}</p>
            <Stars rating={insight.rating} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{insight.summary}</p>
          {/* Conditions match bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{pct}% match</span>
          </div>
        </div>
        <span className="text-gray-300 ml-1">›</span>
      </div>
    </button>
  )
}

function DetailSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  )
}

function CondBox({ emoji, label, value }) {
  return (
    <div className="bg-ocean-50 rounded-lg p-2.5">
      <p className="text-xs text-ocean-500">{emoji} {label}</p>
      <p className="font-bold text-ocean-900 text-sm mt-0.5">{value}</p>
    </div>
  )
}

function TimeRow({ emoji, label, value }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-base">{emoji}</span>
      <span className="text-sm text-gray-500 w-16">{label}</span>
      <span className="text-sm font-semibold text-gray-700">{value ?? '–'}</span>
    </div>
  )
}

// ── Conditions banner ─────────────────────────────────────────────────────────

function ConditionsBanner({ fetchedAt, loading, error, source, onRefresh }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-ocean-50 border border-ocean-100 rounded-xl px-4 py-2.5 text-xs text-ocean-600 animate-pulse">
        <span>🌊</span>
        <span>Fetching marine conditions…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs text-red-600">
          <span>⚠️</span>
          <span>{error.includes('402')
            ? 'Stormglass daily limit reached — try refreshing tomorrow'
            : error.includes('429')
            ? 'Too many requests — try again later'
            : `Conditions unavailable: ${error}`}
          </span>
        </div>
        {!error.includes('402') && (
          <button onClick={onRefresh} className="text-xs text-red-500 font-medium hover:text-red-700 ml-3 shrink-0">
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!fetchedAt) return null

  const fetchDate = new Date(fetchedAt)
  const now = new Date()
  const diffMins = Math.round((now - fetchDate) / 60000)
  const timeStr = fetchDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  const agoStr = diffMins < 60
    ? `${diffMins}m ago`
    : `${Math.floor(diffMins / 60)}h ${diffMins % 60}m ago`

  return (
    <div className="flex items-center justify-between bg-ocean-50 border border-ocean-100 rounded-xl px-4 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-ocean-600">
        <span>{source === 'fresh' ? '🟢' : '💾'}</span>
        <span>
          {source === 'fresh' ? 'Full Stormglass dataset fetched' : 'Stormglass data loaded from cache'} at{' '}
          <strong>{timeStr}</strong>
          <span className="text-ocean-400 ml-1">({agoStr})</span>
        </span>
      </div>
      <button
        onClick={onRefresh}
        className="text-xs text-ocean-600 font-semibold hover:text-ocean-800 border border-ocean-200 hover:border-ocean-400 px-2.5 py-1 rounded-lg transition ml-3 shrink-0"
      >
        ↻ Refresh
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function nextTideStr(tides) {
  if (!tides?.length) return ''
  const now = new Date()
  const next = tides.find((t) => new Date(t.time) > now)
  if (!next) return ''
  const time = new Date(next.time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
  return `Next ${next.type} ${next.height?.toFixed(1)}m @ ${time}`
}

function tempNote(t) {
  if (isNaN(t)) return ''
  if (t >= 16 && t <= 22) return 'Optimal range'
  if (t < 14) return 'Cold — low activity'
  if (t > 24) return 'Warm — move deeper'
  return ''
}
