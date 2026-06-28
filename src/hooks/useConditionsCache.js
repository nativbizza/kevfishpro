import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const BASE = 'https://api.stormglass.io/v2'
const API_KEY = import.meta.env.VITE_STORMGLASS_API_KEY
const CACHE_DOC = 'conditions/cache'

function todayKey() {
  return new Date().toISOString().slice(0, 10) // "2026-06-28"
}

async function fetchFromStormglass(lat, lng) {
  const now = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)
  const headers = { Authorization: API_KEY }

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

  if (!tidesRes.ok)  throw new Error(`Stormglass tides error: ${tidesRes.status}`)
  if (!marineRes.ok) throw new Error(`Stormglass marine error: ${marineRes.status}`)

  const tidesData  = await tidesRes.json()
  const marineData = await marineRes.json()

  const latest = marineData.hours?.[0]
  const marine = latest ? {
    waveHeight:    latest.waveHeight?.sg?.toFixed(1)    ?? '–',
    wavePeriod:    latest.wavePeriod?.sg?.toFixed(0)    ?? '–',
    waveDirection: latest.waveDirection?.sg?.toFixed(0) ?? '–',
    windSpeed:     latest.windSpeed?.sg?.toFixed(1)     ?? '–',
    windDirection: latest.windDirection?.sg?.toFixed(0) ?? '–',
    waterTemp:     latest.waterTemperature?.sg?.toFixed(1) ?? '–',
  } : null

  return {
    tides: tidesData.data ?? [],
    marine,
    fetchedAt: new Date().toISOString(),
    date: todayKey(),
    lat,
    lng,
  }
}

export function useConditionsCache(coords) {
  const [tides,     setTides]     = useState(null)
  const [marine,    setMarine]    = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)   // ISO string
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [source,    setSource]    = useState(null)   // 'cache' | 'fresh'

  const load = useCallback(async (lat, lng, forceRefresh = false) => {
    if (!API_KEY) { setError('No Stormglass API key configured'); return }
    setLoading(true)
    setError(null)

    try {
      let data = null

      if (!forceRefresh) {
        // Check Firestore cache first
        const snap = await getDoc(doc(db, CACHE_DOC))
        if (snap.exists()) {
          const cached = snap.data()
          if (cached.date === todayKey()) {
            data = cached
            setSource('cache')
          }
        }
      }

      if (!data) {
        // Fetch fresh from Stormglass
        data = await fetchFromStormglass(lat, lng)
        // Persist to Firestore
        await setDoc(doc(db, CACHE_DOC), data)
        setSource('fresh')
      }

      setTides(data.tides)
      setMarine(data.marine)
      setFetchedAt(data.fetchedAt)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-load when coords become available
  useEffect(() => {
    if (coords?.lat && coords?.lng) {
      load(coords.lat, coords.lng, false)
    }
  }, [coords?.lat, coords?.lng, load])

  const refresh = useCallback(() => {
    if (coords?.lat && coords?.lng) {
      load(coords.lat, coords.lng, true)
    }
  }, [coords?.lat, coords?.lng, load])

  return { tides, marine, fetchedAt, loading, error, source, refresh }
}
