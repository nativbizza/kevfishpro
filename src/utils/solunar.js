import SunCalc from 'suncalc'

// Sample moon altitude every 5 minutes through the day to find transits
function sampleDay(date, lat, lng) {
  const samples = []
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  for (let i = 0; i < 288; i++) {
    const t = new Date(start.getTime() + i * 5 * 60000)
    const pos = SunCalc.getMoonPosition(t, lat, lng)
    samples.push({ time: t, alt: pos.altitude })
  }
  return samples
}

function findPeaks(samples) {
  const peaks = []
  for (let i = 1; i < samples.length - 1; i++) {
    const p = samples[i - 1].alt, c = samples[i].alt, n = samples[i + 1].alt
    if (c > p && c > n) peaks.push({ time: samples[i].time, type: 'upper' })
    if (c < p && c < n) peaks.push({ time: samples[i].time, type: 'lower' })
  }
  return peaks
}

function fmt(date) {
  return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
}

export function getSolunarData(date, lat, lng) {
  const moonTimes = SunCalc.getMoonTimes(date, lat, lng)
  const illum = SunCalc.getMoonIllumination(date)
  const samples = sampleDay(date, lat, lng)
  const peaks = findPeaks(samples)

  const periods = []

  // Major periods — moon overhead/underfoot (±60 min window)
  peaks.forEach((p) => {
    periods.push({
      type: 'major',
      label: p.type === 'upper' ? '🌕 Moon Overhead' : '🌑 Moon Underfoot',
      peak: p.time,
      start: new Date(p.time.getTime() - 60 * 60000),
      end:   new Date(p.time.getTime() + 60 * 60000),
      peakStr: fmt(p.time),
    })
  })

  // Minor periods — moonrise/set (±30 min window)
  if (moonTimes.rise) {
    periods.push({
      type: 'minor',
      label: '🌙 Moonrise',
      peak: moonTimes.rise,
      start: new Date(moonTimes.rise.getTime() - 30 * 60000),
      end:   new Date(moonTimes.rise.getTime() + 30 * 60000),
      peakStr: fmt(moonTimes.rise),
    })
  }
  if (moonTimes.set) {
    periods.push({
      type: 'minor',
      label: '🌛 Moonset',
      peak: moonTimes.set,
      start: new Date(moonTimes.set.getTime() - 30 * 60000),
      end:   new Date(moonTimes.set.getTime() + 30 * 60000),
      peakStr: fmt(moonTimes.set),
    })
  }

  periods.sort((a, b) => a.start - b.start)

  const now = new Date()
  const activePeriod = periods.find((p) => now >= p.start && now <= p.end) ?? null
  const nextPeriod   = periods.find((p) => p.start > now) ?? null
  const minsToNext   = nextPeriod ? Math.round((nextPeriod.start - now) / 60000) : null

  // Moon phase fishing rating (new + full moon are best)
  const phase = illum.phase
  let moonRating, moonLabel
  if (phase < 0.08 || phase > 0.92) { moonRating = 5; moonLabel = 'New Moon — excellent' }
  else if (phase > 0.42 && phase < 0.58) { moonRating = 5; moonLabel = 'Full Moon — excellent' }
  else if (phase < 0.22 || phase > 0.78) { moonRating = 3; moonLabel = 'Crescent — moderate' }
  else if (phase > 0.28 && phase < 0.42) { moonRating = 3; moonLabel = 'Waxing Gibbous — good' }
  else if (phase > 0.58 && phase < 0.72) { moonRating = 3; moonLabel = 'Waning Gibbous — good' }
  else { moonRating = 2; moonLabel = 'Quarter Moon — below average' }

  // Sun times for dawn/dusk fishing windows
  const sunTimes = SunCalc.getTimes(date, lat, lng)

  return {
    periods,
    activePeriod,
    nextPeriod,
    minsToNext,
    moonPhase: illum.phase,
    moonIllum: Math.round(illum.fraction * 100),
    moonRating,
    moonLabel,
    moonrise:  moonTimes.rise    ? fmt(moonTimes.rise)         : null,
    moonset:   moonTimes.set     ? fmt(moonTimes.set)          : null,
    dawn:      sunTimes.nauticalDawn ? fmt(sunTimes.nauticalDawn) : null,
    sunrise:   sunTimes.sunrise  ? fmt(sunTimes.sunrise)       : null,
    sunset:    sunTimes.sunset   ? fmt(sunTimes.sunset)        : null,
    dusk:      sunTimes.nauticalDusk ? fmt(sunTimes.nauticalDusk) : null,
    sunriseDate:  sunTimes.sunrise  ?? null,
    sunsetDate:   sunTimes.sunset   ?? null,
  }
}
