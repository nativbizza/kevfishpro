import { bearingToCompass } from '../hooks/useStormglass'

// Score 0-10, return insights array
export function scoreConditions({ tideType, waveHeight, windSpeed, windDirection, waterTemp, moonRating }) {
  const insights = []
  let score = 5 // baseline

  // --- Tide ---
  if (tideType === 'Incoming') {
    score += 2
    insights.push({ key: 'tide', positive: true, text: 'Incoming tide', detail: 'Fish push in with the tide to feed in the shallows. This is the #1 factor for most SA surf species — especially Kob, Shad and Steenbras.' })
  } else if (tideType === 'High Slack') {
    score += 1
    insights.push({ key: 'tide', positive: true, text: 'High slack tide', detail: 'The brief pause at high tide can produce good bites as fish settle into feeding positions before the water starts running out.' })
  } else if (tideType === 'Outgoing') {
    score -= 1
    insights.push({ key: 'tide', positive: null, text: 'Outgoing tide', detail: 'Fish tend to move back with the outgoing tide. Still fishable — Shad and Garrick can be active — but incoming is generally more productive.' })
  } else if (tideType === 'Low Slack') {
    score -= 2
    insights.push({ key: 'tide', positive: false, text: 'Low slack tide', detail: 'Typically the least productive period. Water is shallow and still. Most experienced SA anglers use this time to rest and rebait.' })
  }

  // --- Swell ---
  const wave = parseFloat(waveHeight)
  if (!isNaN(wave)) {
    if (wave >= 0.3 && wave <= 1.2) {
      score += 2
      insights.push({ key: 'swell', positive: true, text: `${wave}m swell — ideal`, detail: 'Clean, manageable surf. Good water movement to disperse berley and scent trails. Ideal for most shore and rock fishing.' })
    } else if (wave > 1.2 && wave <= 2.0) {
      score += 1
      insights.push({ key: 'swell', positive: true, text: `${wave}m swell — good`, detail: 'Slightly bigger surf but still very fishable. Heavier sinkers recommended. Kob and Musselcracker can be active in this chop.' })
    } else if (wave > 2.0 && wave <= 2.8) {
      score -= 1
      insights.push({ key: 'swell', positive: null, text: `${wave}m swell — rough`, detail: 'Surf is getting heavier. Rock spots will be unsafe. Sheltered bays and harbour walls become better options.' })
    } else if (wave > 2.8) {
      score -= 3
      insights.push({ key: 'swell', positive: false, text: `${wave}m swell — too rough`, detail: 'Dangerous for shore fishing. Water visibility will be very poor. Most fish will have moved deeper. Wait for it to settle.' })
    }
  }

  // --- Wind ---
  const wind = parseFloat(windSpeed)
  if (!isNaN(wind)) {
    const dir = windDirection ? bearingToCompass(windDirection) : ''
    if (wind < 8) {
      score += 2
      insights.push({ key: 'wind', positive: true, text: `Calm (${wind} m/s)`, detail: 'Near-perfect conditions. Easy casting, good line control, and fish are less spooked by surface disturbance.' })
    } else if (wind < 15) {
      score += 1
      insights.push({ key: 'wind', positive: true, text: `Light wind ${dir} (${wind} m/s)`, detail: 'Good conditions. Light onshore winds can actually improve fishing by pushing baitfish toward the shore.' })
    } else if (wind < 25) {
      score -= 1
      insights.push({ key: 'wind', positive: null, text: `Moderate wind ${dir} (${wind} m/s)`, detail: 'Manageable but harder to cast accurately. Offshore winds can create difficult casting. Onshore winds push warmer surface water in.' })
    } else {
      score -= 2
      insights.push({ key: 'wind', positive: false, text: `Strong wind ${dir} (${wind} m/s)`, detail: 'Difficult fishing conditions. Strong offshore winds push baitfish and predators away. Line control and bite detection are compromised.' })
    }
  }

  // --- Water temp ---
  const temp = parseFloat(waterTemp)
  if (!isNaN(temp)) {
    if (temp >= 16 && temp <= 22) {
      score += 1
      insights.push({ key: 'temp', positive: true, text: `Water ${temp}°C — optimal`, detail: 'Water temperature is in the ideal range for most SA pelagic and surf species. Kob, Shad and Yellowtail are all active in this range.' })
    } else if (temp < 14) {
      score -= 1
      insights.push({ key: 'temp', positive: false, text: `Water ${temp}°C — cold`, detail: 'Cold water suppresses fish metabolism and feeding activity. Upwelling events can bring cold water to the surface — check for sudden temp drops.' })
    } else if (temp > 24) {
      score -= 1
      insights.push({ key: 'temp', positive: null, text: `Water ${temp}°C — warm`, detail: 'Warm water can reduce oxygen levels. Some warm-water species like Yellowfin Tuna become more active, but inshore species may move deeper.' })
    }
  }

  // --- Moon phase bonus ---
  if (moonRating >= 5) score += 1

  const clamped = Math.max(1, Math.min(10, score))
  return { score: clamped, insights }
}

export function overallRatingLabel(score) {
  if (score >= 9)  return { label: 'Exceptional', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
  if (score >= 7)  return { label: 'Good',        color: 'text-green-600',   bg: 'bg-green-50',   border: 'border-green-200' }
  if (score >= 5)  return { label: 'Average',     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' }
  if (score >= 3)  return { label: 'Poor',        color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200' }
  return                  { label: 'Very Poor',   color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' }
}
