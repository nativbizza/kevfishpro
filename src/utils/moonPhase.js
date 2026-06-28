import SunCalc from 'suncalc'
import { MOON_PHASES } from '../constants'

export function getMoonInfo(date) {
  const illumination = SunCalc.getMoonIllumination(date)
  const phase = illumination.phase // 0–1

  const phaseInfo = MOON_PHASES.find(
    (p) => phase >= p.min && phase < p.max
  ) || MOON_PHASES[0]

  return {
    phase,
    phaseName: phaseInfo.name,
    phaseEmoji: phaseInfo.emoji,
    illuminationPercent: Math.round(illumination.fraction * 100),
  }
}
