import { useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useStormglass, bearingToCompass } from '../hooks/useStormglass'
import { nearestT4FLocation, PROVINCES, locationsByProvince } from '../utils/tides4fishing'

export default function Home() {
  const { coords: gpsCoords, loading: locLoading, error: locError, refresh } = useGeolocation()
  const [manualLocation, setManualLocation] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [selectedProvince, setSelectedProvince] = useState(null)

  const coords = manualLocation
    ? { lat: manualLocation.lat, lng: manualLocation.lng }
    : gpsCoords

  const { tides, marine, loading: tidesLoading, error: tidesError } = useStormglass(coords)
  const nearest = coords ? nearestT4FLocation(coords.lat, coords.lng) : null
  const hasStormglassKey = !!import.meta.env.VITE_STORMGLASS_API_KEY

  const locationLabel = manualLocation
    ? `${manualLocation.name}, ${manualLocation.province}`
    : nearest
    ? `${nearest.name} (GPS)`
    : 'Detecting location…'

  const handleManualSelect = (loc) => {
    setManualLocation(loc)
    setShowPicker(false)
    setSelectedProvince(null)
  }

  const handleUseGPS = () => {
    setManualLocation(null)
    setShowPicker(false)
    setSelectedProvince(null)
    refresh()
  }

  const openPicker = () => {
    setShowPicker(true)
    setSelectedProvince(null)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Hero */}
      <div className="bg-ocean-800 rounded-2xl px-5 py-6 text-white">
        <h1 className="text-2xl font-bold mb-1">🎣 KevFishPro</h1>
        <p className="text-ocean-200 text-sm">Your SA fishing companion</p>

        {/* Location badge + change button */}
        <div className="mt-4 flex items-center justify-between bg-ocean-700 rounded-xl px-4 py-2.5">
          <div>
            <p className="text-xs text-ocean-300">Current Location</p>
            <p className="font-semibold text-white">
              {locLoading && !manualLocation ? '📍 Detecting…' : locationLabel}
            </p>
          </div>
          <button
            onClick={() => showPicker ? setShowPicker(false) : openPicker()}
            className="text-xs bg-ocean-600 hover:bg-ocean-500 px-3 py-1.5 rounded-lg font-medium transition"
          >
            Change
          </button>
        </div>

        {locError && !manualLocation && (
          <p className="text-xs text-amber-300 mt-2">⚠️ Location denied — select manually below</p>
        )}
      </div>

      {/* Location picker — Step 1: Province, Step 2: Location */}
      {showPicker && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          {!selectedProvince ? (
            <>
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">
                Select Province
              </h2>
              <button
                onClick={handleUseGPS}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-ocean-700 bg-ocean-50 hover:bg-ocean-100 mb-2 transition flex items-center gap-2"
              >
                📍 Use my GPS location
              </button>
              <div className="space-y-1">
                {PROVINCES.map((province) => (
                  <button
                    key={province}
                    onClick={() => setSelectedProvince(province)}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition flex items-center justify-between"
                  >
                    <span>{province}</span>
                    <span className="text-gray-400 text-xs">
                      {locationsByProvince(province).length} spots →
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setSelectedProvince(null)}
                  className="text-ocean-600 hover:text-ocean-800 text-sm font-medium"
                >
                  ← Provinces
                </button>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-gray-800 text-sm">{selectedProvince}</span>
              </div>
              <div className="space-y-1">
                {locationsByProvince(selectedProvince).map((loc) => (
                  <button
                    key={loc.url}
                    onClick={() => handleManualSelect(loc)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${
                      manualLocation?.name === loc.name
                        ? 'bg-ocean-100 text-ocean-800 font-semibold'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tides4Fishing panel */}
      {nearest && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="bg-ocean-700 px-4 py-3">
            <h2 className="text-white font-semibold">🌊 Solunar Forecast — {nearest.name}</h2>
            <p className="text-ocean-200 text-xs mt-0.5">Tide table, fish activity & solunar chart</p>
          </div>
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-600">
              View the full tide table and solunar fishing forecast for <strong>{nearest.name}</strong>
              {nearest.distanceKm > 0 && ` (${nearest.distanceKm} km from your location)`} on tides4fishing.
            </p>
            <a
              href={nearest.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-ocean-700 hover:bg-ocean-800 text-white font-semibold py-3 rounded-xl transition text-sm"
            >
              Open Full Forecast on tides4fishing →
            </a>
          </div>
        </div>
      )}

      {/* Live Conditions from Stormglass */}
      {!hasStormglassKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">⚠️ Add Stormglass API key for live conditions</p>
          <a href="https://stormglass.io" target="_blank" rel="noopener noreferrer" className="underline">
            Get free key at stormglass.io →
          </a>
        </div>
      ) : tidesLoading ? (
        <div className="flex items-center gap-3 text-gray-400 text-sm px-2">
          <span className="animate-pulse text-2xl">🌊</span> Fetching live conditions…
        </div>
      ) : tidesError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Could not load tide data: {tidesError}
        </div>
      ) : (
        <>
          {/* Today's tides */}
          {tides?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
              <h2 className="font-semibold text-gray-800 text-sm uppercase tracking-wide mb-3">📈 Today's Tides</h2>
              <div className="divide-y divide-gray-100">
                {tides.map((t, i) => {
                  const time = new Date(t.time).toLocaleTimeString('en-ZA', {
                    hour: '2-digit', minute: '2-digit',
                  })
                  const isHigh = t.type === 'high'
                  return (
                    <div key={i} className="flex items-center justify-between py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{isHigh ? '🔼' : '🔽'}</span>
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
                <CondCard emoji="🧭" label="Swell" value={bearingToCompass(marine.waveDirection)} />
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
