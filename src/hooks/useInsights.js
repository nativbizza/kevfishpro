import { useMemo } from 'react'
import { getSolunarData } from '../utils/solunar'
import { scoreConditions } from '../utils/conditionInsights'
import { getSpeciesInsights } from '../utils/speciesInsights'

export function useInsights({ coords, marine, tides, sessions = [], province = null }) {
  return useMemo(() => {
    const now = new Date()
    const lat = coords?.lat ?? -33.9249
    const lng = coords?.lng ?? 18.4241

    // ── Solunar ──────────────────────────────────────────────────────────────
    const solunar = getSolunarData(now, lat, lng)

    const solunarInsights = []

    // Active or upcoming period
    if (solunar.activePeriod) {
      solunarInsights.push({
        id: 'solunar-active',
        source: 'solunar',
        icon: '🟢',
        title: `Active: ${solunar.activePeriod.label}`,
        summary: `You are currently in a ${solunar.activePeriod.type} feeding period. Fish now!`,
        rating: solunar.activePeriod.type === 'major' ? 5 : 4,
        detail: `This is one of the best times to be fishing right now. The ${solunar.activePeriod.label.toLowerCase()} creates a gravitational pull that triggers feeding behaviour in most fish species. ${solunar.activePeriod.type === 'major' ? 'Major periods (2 hours) are the strongest of the day.' : 'Minor periods (1 hour) are still highly productive.'}`,
        periods: solunar.periods,
      })
    } else if (solunar.nextPeriod) {
      const urgent = solunar.minsToNext <= 30
      solunarInsights.push({
        id: 'solunar-next',
        source: 'solunar',
        icon: urgent ? '⏰' : '🕐',
        title: `${solunar.nextPeriod.label} in ${solunar.minsToNext} min`,
        summary: urgent
          ? `Get your lines in — ${solunar.nextPeriod.type} feeding period starts soon.`
          : `Next feeding window at ${solunar.nextPeriod.peakStr}.`,
        rating: solunar.nextPeriod.type === 'major' ? 4 : 3,
        detail: `The next solunar feeding period starts at ${solunar.nextPeriod.peakStr}. ${solunar.nextPeriod.type === 'major' ? 'This is a major period — the strongest kind. Fish tend to feed aggressively for up to 2 hours.' : 'This is a minor period lasting around 1 hour. Still worth being on the water.'}`,
        periods: solunar.periods,
      })
    }

    // Moon phase insight
    solunarInsights.push({
      id: 'solunar-moon',
      source: 'solunar',
      icon: '🌙',
      title: `Moon: ${solunar.moonLabel}`,
      summary: `${solunar.moonIllum}% illuminated. ${solunar.moonRating >= 4 ? 'Excellent phase for fishing.' : solunar.moonRating >= 3 ? 'Decent moon phase.' : 'Average moon phase.'}`,
      rating: solunar.moonRating,
      detail: `Tonight's moon is ${solunar.moonIllum}% illuminated (${solunar.moonLabel}). New and full moons create the strongest gravitational forces, producing the highest and lowest tides and triggering the most pronounced feeding behaviour. Quarter moons are typically the least productive lunar phase for fishing.\n\nMoonrise: ${solunar.moonrise ?? 'N/A'} · Moonset: ${solunar.moonset ?? 'N/A'}`,
      periods: solunar.periods,
    })

    // Full periods list insight
    solunarInsights.push({
      id: 'solunar-schedule',
      source: 'solunar',
      icon: '📅',
      title: "Today's Feeding Windows",
      summary: `${solunar.periods.length} solunar periods today. Tap to see all times.`,
      rating: 3,
      detail: solunar.periods
        .map((p) => `${p.type === 'major' ? '●' : '○'} ${p.label}: ${p.peakStr} (${p.type === 'major' ? '±60 min' : '±30 min'})`)
        .join('\n'),
      periods: solunar.periods,
    })

    // ── Conditions ───────────────────────────────────────────────────────────
    // Infer tideType from latest tides data if not provided directly
    const tideType = inferTideType(tides)
    const { score: condScore, insights: condRaw } = scoreConditions({
      tideType,
      waveHeight: marine?.waveHeight,
      windSpeed: marine?.windSpeed,
      windDirection: marine?.windDirection ? parseFloat(marine.windDirection) : null,
      waterTemp: marine?.waterTemp,
      moonRating: solunar.moonRating,
    })

    const conditionInsights = condRaw.map((c, i) => ({
      id: `conditions-${c.key}`,
      source: 'conditions',
      icon: condIcon(c.key),
      title: c.text,
      summary: c.detail.split('.')[0] + '.',
      rating: c.positive === true ? 4 : c.positive === false ? 2 : 3,
      detail: c.detail,
    }))

    // ── Species ───────────────────────────────────────────────────────────────
    const speciesInsights = getSpeciesInsights(marine, tideType, solunar.moonLabel, sessions, province)

    // ── My Logs ───────────────────────────────────────────────────────────────
    const myLogsInsights = analyseMyLogs(sessions)

    // ── Overall fishing score ─────────────────────────────────────────────────
    const overallScore = Math.round(
      (condScore + solunar.moonRating * 2) / 3
    )

    return {
      solunar,
      overallScore,
      insights: {
        solunar: solunarInsights,
        conditions: conditionInsights,
        species: speciesInsights,
        myLogs: myLogsInsights,
      },
      tideType,
    }
  }, [coords?.lat, coords?.lng, marine, tides, sessions?.length])
}

function condIcon(key) {
  return { tide: '🌊', swell: '🌀', wind: '💨', temp: '🌡️' }[key] ?? '📊'
}

function inferTideType(tides) {
  if (!tides || tides.length < 2) return null
  const now = new Date()
  // Find the previous and next extremes
  const past = [...tides].reverse().find((t) => new Date(t.time) <= now)
  const next = tides.find((t) => new Date(t.time) > now)
  if (!past || !next) return null
  if (past.type === 'low' && next.type === 'high') return 'Incoming'
  if (past.type === 'high' && next.type === 'low') return 'Outgoing'
  return null
}

function analyseMyLogs(sessions) {
  if (!sessions || sessions.length < 3) {
    return [{
      id: 'mylogs-empty',
      source: 'myLogs',
      icon: '📊',
      title: 'Not enough data yet',
      summary: 'Log at least 3 sessions to start seeing personal patterns.',
      rating: 3,
      detail: 'KevFishPro will analyse your catch history against conditions (tide, moon, swell, wind) to surface your personal best patterns. The more you log, the smarter the insights get.',
    }]
  }

  const insights = []

  // Best tide analysis
  const tideGroups = {}
  sessions.forEach((s) => {
    const t = s.tideType || 'Unknown'
    if (!tideGroups[t]) tideGroups[t] = { total: 0, count: 0 }
    tideGroups[t].total += totalCatch(s)
    tideGroups[t].count++
  })
  const bestTide = Object.entries(tideGroups).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]
  if (bestTide) {
    const avg = (bestTide[1].total / bestTide[1].count).toFixed(1)
    insights.push({
      id: 'mylogs-tide',
      source: 'myLogs',
      icon: '🌊',
      title: `Your best tide: ${bestTide[0]}`,
      summary: `Avg ${avg} fish per session on ${bestTide[0]} tide across ${bestTide[1].count} sessions.`,
      rating: 4,
      detail: `Based on your ${sessions.length} logged sessions, you catch an average of ${avg} fish per session during ${bestTide[0]} tides. This is your most productive tidal condition from your own data.`,
    })
  }

  // Best species
  const speciesCounts = {}
  sessions.forEach((s) => {
    s.catches?.forEach((c) => {
      if (c.species) {
        speciesCounts[c.species] = (speciesCounts[c.species] || 0) + (parseInt(c.qty) || 0)
      }
    })
  })
  const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  if (topSpecies.length > 0) {
    insights.push({
      id: 'mylogs-species',
      source: 'myLogs',
      icon: '🐟',
      title: `Your top catch: ${topSpecies[0][0]}`,
      summary: `${topSpecies[0][1]} total ${topSpecies[0][0]} across all sessions.`,
      rating: 4,
      detail: `Your top 3 species by total catch:\n${topSpecies.map(([s, n], i) => `${i + 1}. ${s} — ${n} fish`).join('\n')}\n\nThis is based on ${sessions.length} logged sessions.`,
    })
  }

  // Moon phase analysis
  const moonGroups = {}
  sessions.forEach((s) => {
    const m = s.moonPhase || 'Unknown'
    if (!moonGroups[m]) moonGroups[m] = { total: 0, count: 0 }
    moonGroups[m].total += totalCatch(s)
    moonGroups[m].count++
  })
  const bestMoon = Object.entries(moonGroups)
    .filter(([k]) => k !== 'Unknown')
    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]
  if (bestMoon && bestMoon[1].count >= 2) {
    const avg = (bestMoon[1].total / bestMoon[1].count).toFixed(1)
    insights.push({
      id: 'mylogs-moon',
      source: 'myLogs',
      icon: '🌙',
      title: `Your best moon: ${bestMoon[0]}`,
      summary: `Avg ${avg} fish/session during ${bestMoon[0]} across your logs.`,
      rating: 4,
      detail: `From your personal catch history, you average ${avg} fish per session during ${bestMoon[0]} phases. Use this alongside the solunar forecast to find your optimal fishing windows.`,
    })
  }

  // Best location
  const locGroups = {}
  sessions.forEach((s) => {
    const l = s.location || 'Unknown'
    if (!locGroups[l]) locGroups[l] = { total: 0, count: 0 }
    locGroups[l].total += totalCatch(s)
    locGroups[l].count++
  })
  const bestLoc = Object.entries(locGroups)
    .filter(([k]) => k !== 'Unknown')
    .sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0]
  if (bestLoc && bestLoc[1].count >= 2) {
    insights.push({
      id: 'mylogs-location',
      source: 'myLogs',
      icon: '📍',
      title: `Your best spot: ${bestLoc[0]}`,
      summary: `${(bestLoc[1].total / bestLoc[1].count).toFixed(1)} avg fish/session at ${bestLoc[0]}.`,
      rating: 4,
      detail: `${bestLoc[0]} is your most productive location based on ${bestLoc[1].count} sessions there, averaging ${(bestLoc[1].total / bestLoc[1].count).toFixed(1)} fish per trip.`,
    })
  }

  return insights
}

function totalCatch(session) {
  return session.catches?.reduce((sum, c) => sum + (parseInt(c.qty) || 0), 0) ?? 0
}
