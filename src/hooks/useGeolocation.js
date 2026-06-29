import { useState, useEffect } from 'react'
import { Geolocation } from '@capacitor/geolocation'

async function getPosition() {
  try {
    await Geolocation.requestPermissions()
  } catch {
    // web platform doesn't support requestPermissions, falls through to getCurrentPosition
  }
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
  return { lat: pos.coords.latitude, lng: pos.coords.longitude }
}

export function useGeolocation() {
  const [coords, setCoords] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    setLoading(true)
    setError(null)
    getPosition()
      .then((c) => { setCoords(c); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }

  useEffect(() => { fetch() }, [])

  return { coords, error, loading, refresh: fetch }
}
