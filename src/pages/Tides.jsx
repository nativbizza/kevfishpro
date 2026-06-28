import { useGeolocation } from '../hooks/useGeolocation'
import { useStormglass, bearingToCompass } from '../hooks/useStormglass'
import { nearestT4FLocation } from '../utils/tides4fishing'

export default function Tides() {
  const { coords, loading: locLoading, error: locError, refresh } = useGeolocation()
  const { tides, marine, loading: tidesLoading, error: tidesError } = useStormglass(coords)
  const nearest = coords ? nearestT4FLocation(coords.lat, coords.lng) : null
  const hasStormglassKey = !!import.meta.env.VITE_STORMGLASS_API_KEY

  if (locLoading) {
    return <StatusScreen emoji="📍" message="Getting your location…" />
  }

  if (locError) {
    return (
      <StatusScreen
        emoji="🚫"
        message="Location access denied"
        sub="Enable location permissions in your browser settings, then refresh."
        action={<button onClick={refresh} className="btn-primary mt-4">Try Again</button>}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-ocean-800">🌊 Tides & Conditions</h1>
        <button onClick={refresh} className="text-xs text-ocean-600 hover:text-ocean-800 border border-ocean-200 px-3 py-1.5 rounded-lg">
          📍 Refresh Location
        </button>
      </div>

      {/* Current location */}
      {coords && (
        <div className="bg-ocean-50 border border-ocean-200 rounded-xl px-4 py-3 text-sm text-ocean-700">
          <span className="font-medium">Your location: </span>
          {coords.lat.toFixed(4)}°S, {coords.lng.toFixed(4)}°E
          {nearest && (
            <span className="ml-2 text-ocean-500">· Nearest spot: <strong>{nearest.name}</strong> ({nearest.distanceKm} km)</span>
          )}
        </div>
      )}

      {/* Tides4Fishing deep link */}
      {nearest && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">🎣 Solunar Forecast</h2>
          <p className="text-sm text-gray-600 mb-3">
            Full tide table, solunar chart and fish activity forecast for <strong>{nearest.name}</strong> on tides4fishing.
          </p>
          <a
            href={nearest.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
          >
            Open {nearest.name} on tides4fishing →
          </a>
        </div>
      )}

      {/* Stormglass live conditions */}
      {!hasStormglassKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Stormglass API key not set</p>
          <p>Add <code className="bg-amber-100 px-1 rounded">VITE_STORMGLASS_API_KEY</code> to your <code>.env</code> to see live tide and swell data.</p>
          <a href="https://stormglass.io" target="_blank" rel="noopener noreferrer" className="underline mt-1 inline-block">Get a free key at stormglass.io →</a>
        </div>
      ) : tidesLoading ? (
        <StatusScreen emoji="🌊" message="Fetching live conditions…" />
      ) : tidesError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to load tide data: {tidesError}
        </div>
      ) : (
        <>
          {/* Today's tide extremes */}
          {tides?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">📈 Today's Tides</h2>
              <div className="space-y-2">
                {tides.map((t, i) => {
                  const time = new Date(t.time).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                  const isHigh = t.type === 'high'
                  return (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${isHigh ? '🔼' : '🔽'}`}>{isHigh ? '🔼' : '🔽'}</span>
                        <span className={`font-medium ${isHigh ? 'text-ocean-700' : 'text-gray-500'}`}>
                          {isHigh ? 'High Tide' : 'Low Tide'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-800">{t.height?.toFixed(2)}m</span>
                        <span className="text-gray-400 ml-2">{time}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Current marine conditions */}
          {marine && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">🌬️ Current Conditions</h2>
              <div className="grid grid-cols-2 gap-3">
                <CondCard emoji="🌊" label="Wave Height" value={`${marine.waveHeight}m`} />
                <CondCard emoji="⏱️" label="Wave Period" value={`${marine.wavePeriod}s`} />
                <CondCard emoji="🧭" label="Swell Direction" value={bearingToCompass(marine.waveDirection)} />
                <CondCard emoji="💨" label="Wind" value={`${marine.windSpeed} m/s ${bearingToCompass(marine.windDirection)}`} />
                <CondCard emoji="🌡️" label="Water Temp" value={`${marine.waterTemp}°C`} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CondCard({ emoji, label, value }) {
  return (
    <div className="bg-ocean-50 rounded-lg p-3">
      <p className="text-xs text-ocean-600 mb-0.5">{emoji} {label}</p>
      <p className="font-bold text-ocean-900 text-lg">{value}</p>
    </div>
  )
}

function StatusScreen({ emoji, message, sub, action }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <p className="text-5xl mb-3">{emoji}</p>
      <p className="text-gray-600 font-medium">{message}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
      {action}
    </div>
  )
}
