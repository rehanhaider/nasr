import type { DeenDay } from '../schemas/deen.js'

export interface AdherenceResult {
  /** 0–100 percentage */
  percentage: number
  completed: number
  total: number
}

/**
 * Calculate adherence % for a set of day records over a given number of cycle days.
 * A prayer counts as completed if it is 'ontime' or 'qada'.
 * A boolean item counts as completed if true.
 * Istighfar counts if >= target.
 */
export function calculateAdherence(
  days: DeenDay[],
  cycleDays: number,
  istighfarTarget: number,
): Record<string, AdherenceResult> {
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const
  const booleans = ['morning_adhkar', 'evening_adhkar', 'night_ayat', 'ruqyah'] as const

  const result: Record<string, AdherenceResult> = {}

  for (const prayer of prayers) {
    const completed = days.filter(
      (d) => d[prayer] === 'ontime' || d[prayer] === 'qada',
    ).length
    result[prayer] = {
      percentage: cycleDays > 0 ? Math.round((completed / cycleDays) * 100) : 0,
      completed,
      total: cycleDays,
    }
  }

  const fajrOntime = days.filter((d) => d.fajr === 'ontime').length
  result['fajr_ontime'] = {
    percentage: cycleDays > 0 ? Math.round((fajrOntime / cycleDays) * 100) : 0,
    completed: fajrOntime,
    total: cycleDays,
  }

  for (const item of booleans) {
    const completed = days.filter((d) => d[item]).length
    result[item] = {
      percentage: cycleDays > 0 ? Math.round((completed / cycleDays) * 100) : 0,
      completed,
      total: cycleDays,
    }
  }

  const istighfarCompleted = days.filter(
    (d) => d.istighfar_count >= istighfarTarget,
  ).length
  result['istighfar'] = {
    percentage: cycleDays > 0 ? Math.round((istighfarCompleted / cycleDays) * 100) : 0,
    completed: istighfarCompleted,
    total: cycleDays,
  }

  return result
}

/**
 * Overall adherence across all tracked items for a set of days.
 */
export function overallAdherence(
  days: DeenDay[],
  cycleDays: number,
  istighfarTarget: number,
): AdherenceResult {
  const items = calculateAdherence(days, cycleDays, istighfarTarget)
  const keys = Object.keys(items).filter((k) => k !== 'fajr_ontime')
  if (keys.length === 0) return { percentage: 0, completed: 0, total: 0 }

  const totalCompleted = keys.reduce((sum, k) => sum + items[k].completed, 0)
  const totalPossible = keys.reduce((sum, k) => sum + items[k].total, 0)

  return {
    percentage:
      totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
    completed: totalCompleted,
    total: totalPossible,
  }
}
