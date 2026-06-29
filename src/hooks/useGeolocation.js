import { useState, useEffect } from 'react'
import { Geolocation } from '@capacitor/geolocation'

async function getPosition() {
  let status
  try {
    status = await Geolocation.checkPermissions()
  } catch {
    // web — fall straight through to getCurrentPosition
  }

  if (status?.location === 'denied') {
    throw new Error('Location permission denied. Please enable it in your device Settings → Apps → KevFishPro → Permissions → Location.')
  }

  if (status?.location === 'prompt' || status?.location === 'prompt-with-rationale') {
    const result = await Geolocation.requestPermissions({ permissions: ['location'] })
    if (result.location === 'denied') {
      throw new Error('Location permission denied. Please enable it in Settings → Apps → KevFishPro → Permissions → Location.')
    }
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
