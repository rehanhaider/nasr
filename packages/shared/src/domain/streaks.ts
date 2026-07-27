import type { DeenDay, PrayerStatus } from '../schemas/deen.js'

export interface StreakResult {
  current: number
  longest: number
}

/**
 * Compute current and longest streaks for a boolean predicate applied to
 * sorted (ascending by date) day records.
 */
export function computeStreak(
  days: Pick<DeenDay, 'date'>[],
  predicate: (day: Pick<DeenDay, 'date'>) => boolean,
  today: string,
): StreakResult {
  if (days.length === 0) return { current: 0, longest: 0 }

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))

  let longest = 0
  let running = 0
  let lastMatchDate: string | null = null

  for (const day of sorted) {
    if (predicate(day)) {
      if (
        lastMatchDate === null ||
        dayDiff(lastMatchDate, day.date) === 1
      ) {
        running++
      } else {
        running = 1
      }
      lastMatchDate = day.date
      if (running > longest) longest = running
    } else {
      running = 0
      lastMatchDate = null
    }
  }

  // Current streak is valid only if the last match is today or yesterday
  const current =
    lastMatchDate !== null &&
    (lastMatchDate === today || dayDiff(lastMatchDate, today) === 1)
      ? running
      : 0

  return { current, longest }
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

export function fajrOnTimeStreak(
  days: Pick<DeenDay, 'date' | 'fajr'>[],
  today: string,
): StreakResult {
  return computeStreak(days, (d) => (d as { fajr: PrayerStatus }).fajr === 'ontime', today)
}

export function prayerStreak(
  days: Pick<DeenDay, 'date'>[],
  prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
  statusFilter: PrayerStatus[],
  today: string,
): StreakResult {
  return computeStreak(
    days,
    (d) => {
      const val = (d as Record<string, unknown>)[prayer] as PrayerStatus
      return val !== null && statusFilter.includes(val)
    },
    today,
  )
}
