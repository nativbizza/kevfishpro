import { useState, useEffect, useCallback } from 'react'
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase'
import { T4F_LOCATIONS } from '../utils/tides4fishing'

const STORMGLASS_KEY = import.meta.env.VITE_STORMGLASS_API_KEY

export function locationSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

// ── Open-Meteo (free, no key) ─────────────────────────────────────────────────

async function fetchOpenMeteo(lat, lng) {
  const [marineRes, windRes] = await Promise.all([
    fetch(
      `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lng}` +
      `&hourly=wave_height,wave_period,wave_direction,sea_surface_temperature` +
      `&timezone=Africa%2FJohannesburg&forecast_days=1`
    ),
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms` +
      `&timezone=Africa%2FJohannesburg`
    ),
  ])

  if (!marineRes.ok) throw new Error(`Open-Meteo marine error ${marineRes.status}`)
  if (!windRes.ok)   throw new Error(`Open-Meteo wind error ${windRes.status}`)

  const marineData = await marineRes.json()
  const windData   = await windRes.json()

  const hour = new Date().getHours()
  const h = marineData.hourly

  return {
    waveHeight:    h.wave_height?.[hour]?.toFixed(1)             ?? '–',
    wavePeriod:    h.wave_period?.[hour]?.toFixed(0)             ?? '–',
    waveDirection: h.wave_direction?.[hour]?.toFixed(0)          ?? '–',
    waterTemp:     h.sea_surface_temperature?.[hour]?.toFixed(1) ?? '–',
    windSpeed:     windData.current?.wind_speed_10m?.toFixed(1)  ?? '–',
    windDirection: windData.current?.wind_direction_10m?.toFixed(0) ?? '–',
  }
}

// ── Stormglass tides (1 credit per call) ─────────────────────────────────────

async function fetchStormgласsTides(lat, lng) {
  if (!STORMGLASS_KEY) throw new Error('no-key')
  const now   = new Date()
  const start = new Date(now); start.setHours(0, 0, 0, 0)
  const end   = new Date(now); end.setHours(23, 59, 59, 999)

  const res = await fetch(
    `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}` +
    `&start=${start.toISOString()}&end=${end.toISOString()}`,
    { headers: { Authorization: STORMGLASS_KEY } }
  )
  if (res.status === 402) throw new Error('limit')
  if (!res.ok) throw new Error(`stormglass-${res.status}`)
  const data = await res.json()
  return data.data ?? []
}

function defaultMarine() {
  return {
    waveHeight: '1.5', wavePeriod: '10', waveDirection: '180',
    windSpeed: '5.0', windDirection: '135', waterTemp: '16.0',
  }
}

// ── Admin batch fetch — all locations ─────────────────────────────────────────
// Firestore structure per location:
//   conditions/{slug}: {
//     weather: { data: {...}, fetchedAt, date, error },
//     tides:   { data: [...], fetchedAt, date, error },
//   }

export async function batchFetchAllLocations(onProgress) {
  const batch = writeBatch(db)
  const today = todayKey()
  const results = []

  for (let i = 0; i < T4F_LOCATIONS.length; i++) {
    const loc = T4F_LOCATIONS[i]
    onProgress?.(`Fetching ${loc.name}… (${i + 1}/${T4F_LOCATIONS.length})`)

    let weatherEntry, tidesEntry

    try {
      const data = await fetchOpenMeteo(loc.lat, loc.lng)
      weatherEntry = { data, fetchedAt: new Date().toISOString(), date: today, error: null }
    } catch (e) {
      weatherEntry = { data: defaultMarine(), fetchedAt: new Date().toISOString(), date: today, error: e.message }
    }

    try {
      const data = await fetchStormgласsTides(loc.lat, loc.lng)
      tidesEntry = { data, fetchedAt: new Date().toISOString(), date: today, error: null }
    } catch (e) {
      tidesEntry = { data: [], fetchedAt: new Date().toISOString(), date: today, error: e.message }
    }

    batch.set(
      doc(db, 'conditions', locationSlug(loc.name)),
      { weather: weatherEntry, tides: tidesEntry, locationName: loc.name }
    )
    results.push({ name: loc.name, weatherOk: !weatherEntry.error, tidesOk: !tidesEntry.error })

    await new Promise((r) => setTimeout(r, 200))
  }

  await batch.commit()
  return results
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useConditionsCache(location) {
  const [marine,           setMarine]           = useState(null)
  const [tides,            setTides]            = useState(null)
  const [weatherStatus,    setWeatherStatus]    = useState(null)
  const [tidesStatus,      setTidesStatus]      = useState(null)
  const [weatherFetchedAt, setWeatherFetchedAt] = useState(null)
  const [tidesFetchedAt,   setTidesFetchedAt]   = useState(null)
  const [weatherError,     setWeatherError]     = useState(null)
  const [tidesError,       setTidesError]       = useState(null)

  const load = useCallback(async (loc, forceRefresh = false) => {
    if (!loc) return
    const slug  = locationSlug(loc.name)
    const today = todayKey()

    setWeatherStatus('loading')
    setTidesStatus('loading')
    setWeatherError(null)
    setTidesError(null)

    // ── Read Firestore cache ──────────────────────────────────────────────────
    let cached = {}
    try {
      const snap = await getDoc(doc(db, 'conditions', slug))
      if (snap.exists()) cached = snap.data()
      console.log('[cache] slug:', slug, 'today:', today, 'cached.weather?.date:', cached.weather?.date, 'cached.tides?.date:', cached.tides?.date)
    } catch (e) {
      console.error('[cache] Firestore read failed:', e.code, e.message)
    }

    const weatherValid = !forceRefresh && cached.weather?.date === today
    const tidesValid   = !forceRefresh && cached.tides?.date   === today
    console.log('[cache] weatherValid:', weatherValid, 'tidesValid:', tidesValid)

    // Apply cached values immediately so UI isn't blank while fetching the other
    if (weatherValid) {
      setMarine(cached.weather.data)
      setWeatherFetchedAt(cached.weather.fetchedAt)
      setWeatherStatus(cached.weather.error ? 'failed' : 'cache')
      if (cached.weather.error) setWeatherError(cached.weather.error)
    }
    if (tidesValid) {
      setTides(cached.tides.data)
      setTidesFetchedAt(cached.tides.fetchedAt)
      const te = cached.tides.error
      setTidesStatus(!te ? 'cache' : te === 'limit' ? 'limit' : te === 'no-key' ? 'no-key' : 'failed')
      if (te) setTidesError(te)
    }

    if (weatherValid && tidesValid) return

    // ── Fetch what is stale / missing ─────────────────────────────────────────
    const updates = {}

    if (!weatherValid) {
      try {
        const data = await fetchOpenMeteo(loc.lat, loc.lng)
        updates.weather = { data, fetchedAt: new Date().toISOString(), date: today, error: null }
        setMarine(data)
        setWeatherFetchedAt(updates.weather.fetchedAt)
        setWeatherStatus('fresh')
      } catch (e) {
        updates.weather = { data: defaultMarine(), fetchedAt: new Date().toISOString(), date: today, error: e.message }
        setMarine(defaultMarine())
        setWeatherFetchedAt(updates.weather.fetchedAt)
        setWeatherStatus('failed')
        setWeatherError(e.message)
      }
    }

    if (!tidesValid) {
      try {
        const data = await fetchStormgласsTides(loc.lat, loc.lng)
        updates.tides = { data, fetchedAt: new Date().toISOString(), date: today, error: null }
        setTides(data)
        setTidesFetchedAt(updates.tides.fetchedAt)
        setTidesStatus('fresh')
      } catch (e) {
        updates.tides = { data: [], fetchedAt: new Date().toISOString(), date: today, error: e.message }
        setTides([])
        setTidesFetchedAt(updates.tides.fetchedAt)
        setTidesStatus(e.message === 'limit' ? 'limit' : e.message === 'no-key' ? 'no-key' : 'failed')
        setTidesError(e.message)
      }
    }

    // ── Archive old data to history before overwriting with a new day's fetch ──
    // Only archives when the existing data is from a DIFFERENT day (daily rollover).
    const existingDate = cached.weather?.date ?? cached.tides?.date
    if (existingDate && existingDate !== today && Object.keys(cached).length > 0) {
      try {
        await setDoc(
          doc(db, 'conditionsHistory', `${slug}_${existingDate}`),
          {
            ...cached,
            locationName: cached.locationName ?? loc.name,
            archivedAt:   new Date().toISOString(),
          }
        )
      } catch (e) {
        console.warn('Conditions history archive failed:', e.code, e.message)
      }
    }

    // ── Write to Firestore (merge so weather/tides don't overwrite each other) ─
    if (Object.keys(updates).length > 0) {
      try {
        await setDoc(doc(db, 'conditions', slug), updates, { merge: true })
      } catch (e) {
        console.warn('Conditions cache write failed:', e.code, e.message)
      }
    }
  }, [])

  useEffect(() => {
    if (location?.name && location?.lat && location?.lng) {
      load(location, false)
    }
  }, [location?.name, load])

  const loading = weatherStatus === 'loading' || tidesStatus === 'loading'

  const refresh = useCallback(() => {
    if (location?.name) load(location, true)
  }, [location, load])

  return {
    marine, tides,
    weatherStatus, tidesStatus,
    weatherFetchedAt, tidesFetchedAt,
    weatherError, tidesError,
    loading,
    refresh,
    // Keep fetchedAt for LogDay snapshot compatibility
    fetchedAt: weatherFetchedAt ?? tidesFetchedAt,
  }
}
