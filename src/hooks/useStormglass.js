import { useState, useEffect } from 'react'

const BASE = 'https://api.stormglass.io/v2'
const API_KEY = import.meta.env.VITE_STORMGLASS_API_KEY

export function useStormglass(coords) {
  const [tides, setTides] = useState(null)     // tide extremes for today
  const [marine, setMarine] = useState(null)   // current wave/wind conditions
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coords || !API_KEY) return
    fetchData(coords.lat, coords.lng)
  }, [coords?.lat, coords?.lng])

  const fetchData = async (lat, lng) => {
    setLoading(true)
    setError(null)

    const now = new Date()
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)

    const headers = { Authorization: API_KEY }

    try {
      const [tidesRes, marineRes] = await Promise.all([
        fetch(
          `${BASE}/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start.toISOString()}&end=${end.toISOString()}`,
          { headers }
        ),
        fetch(
          `${BASE}/weather/point?lat=${lat}&lng=${lng}&params=waveHeight,wavePeriod,waveDirection,windSpeed,windDirection,waterTemperature&source=sg`,
          { headers }
        ),
      ])

      if (!tidesRes.ok) throw new Error(`Stormglass tides: ${tidesRes.status}`)
      if (!marineRes.ok) throw new Error(`Stormglass marine: ${marineRes.status}`)

      const tidesData = await tidesRes.json()
      const marineData = await marineRes.json()

      setTides(tidesData.data ?? [])

      // Get the most recent marine data point
      const latest = marineData.hours?.[0]
      if (latest) {
        setMarine({
          waveHeight: latest.waveHeight?.sg?.toFixed(1) ?? '–',
          wavePeriod: latest.wavePeriod?.sg?.toFixed(0) ?? '–',
          waveDirection: latest.waveDirection?.sg?.toFixed(0) ?? '–',
          windSpeed: latest.windSpeed?.sg?.toFixed(1) ?? '–',
          windDirection: latest.windDirection?.sg?.toFixed(0) ?? '–',
          waterTemp: latest.waterTemperature?.sg?.toFixed(1) ?? '–',
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { tides, marine, loading, error }
}

// Convert bearing degrees to compass direction
export function bearingToCompass(deg) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}
