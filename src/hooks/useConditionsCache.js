import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const BASE = 'https://api.stormglass.io/v2'
const API_KEY = import.meta.env.VITE_STORMGLASS_API_KEY
const CACHE_DOC = 'conditions/cache'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// Typical SA coastal defaults — used when Stormglass is unavailable
// Values reflect average conditions for the Western Cape coast
function defaultConditions() {
  return {
    tides: [],
    marine: {
      waveHeight:    '1.5',
      wavePeriod:    '10',
      waveDirection: '180',
      windSpeed:     '5.0',
      windDirection: '135',
      waterTemp:     '16.0',
    },
    fetchedAt: new Date().toISOString(),
    date: todayKey(),
    isDefault: true,
  }
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

  if (!tidesRes.ok)  throw new Error(`${tidesRes.status}`)
  if (!marineRes.ok) throw new Error(`${marineRes.status}`)

  const tidesData  = await tidesRes.json()
  const marineData = await marineRes.json()

  const latest = marineData.hours?.[0]
  const marine = latest ? {
    waveHeight:    latest.waveHeight?.sg?.toFixed(1)       ?? '–',
    wavePeriod:    latest.wavePeriod?.sg?.toFixed(0)       ?? '–',
    waveDirection: latest.waveDirection?.sg?.toFixed(0)    ?? '–',
    windSpeed:     latest.windSpeed?.sg?.toFixed(1)        ?? '–',
    windDirection: latest.windDirection?.sg?.toFixed(0)    ?? '–',
    waterTemp:     latest.waterTemperature?.sg?.toFixed(1) ?? '–',
  } : null

  return {
    tides: tidesData.data ?? [],
    marine,
    fetchedAt: new Date().toISOString(),
    date: todayKey(),
    isDefault: false,
  }
}

export function useConditionsCache(coords) {
  const [tides,     setTides]     = useState(null)
  const [marine,    setMarine]    = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [source,    setSource]    = useState(null) // 'cache' | 'fresh' | 'default'

  const applyData = (data) => {
    setTides(data.tides)
    setMarine(data.marine)
    setFetchedAt(data.fetchedAt)
    setSource(data.isDefault ? 'default' : (data._fromCache ? 'cache' : 'fresh'))
  }

  const load = useCallback(async (lat, lng, forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Check Firestore cache (unless force-refreshing)
      if (!forceRefresh) {
        const snap = await getDoc(doc(db, CACHE_DOC))
        if (snap.exists()) {
          const cached = snap.data()
          if (cached.date === todayKey()) {
            applyData({ ...cached, _fromCache: true })
            setLoading(false)
            return
          }
        }
      }

      // 2. Try Stormglass if API key present
      if (API_KEY) {
        try {
          const fresh = await fetchFromStormglass(lat, lng)
          await setDoc(doc(db, CACHE_DOC), fresh)
          applyData(fresh)
          setLoading(false)
          return
        } catch (sgErr) {
          const code = sgErr.message
          if (code === '402') setError('Daily limit reached — showing estimated conditions')
          else if (code === '401') setError('Invalid API key — showing estimated conditions')
          else setError('Stormglass unavailable — showing estimated conditions')
        }
      }

      // 3. Fall back to defaults — save to Firestore so we don't retry all day
      const defaults = defaultConditions()
      await setDoc(doc(db, CACHE_DOC), defaults)
      applyData(defaults)

    } catch (err) {
      // Firestore itself failed — still show defaults in-memory without saving
      applyData(defaultConditions())
      setError('Could not reach database — showing estimated conditions')
    } finally {
      setLoading(false)
    }
  }, [])

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
