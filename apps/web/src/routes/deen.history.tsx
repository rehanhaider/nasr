import { createFileRoute } from '@tanstack/react-router'
import { useDeenDays, useSettings } from '../data/queries.js'
import {
  getCycleDay,
  cycleDatesForDay,
  calculateAdherence,
  overallAdherence,
  fajrOnTimeStreak,
  getToday,
  isCycleComplete,
} from '@mizan/shared'
import type { DeenDay, PrayerStatus } from '@mizan/shared'

export const Route = createFileRoute('/deen/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const settingsQuery = useSettings()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)
  const startDate = settingsQuery.data?.cycle_start_date
  const deenQuery = useDeenDays()
  const days = deenQuery.data?.days ?? []
  const cycleDay = getCycleDay(startDate ?? null, today)
  const cycleComplete = isCycleComplete(cycleDay)
  const target = settingsQuery.data?.istighfar_target ?? 100

  const cycleDays = cycleDay !== null ? Math.min(cycleDay, 40) : days.length
  const adherence = calculateAdherence(days, cycleDays, target)
  const overall = overallAdherence(days, cycleDays, target)
  const fajrStreak = fajrOnTimeStreak(days, today)
  const calDates = startDate ? cycleDatesForDay(startDate) : []

  const dayMap = new Map(days.map((d) => [d.date, d]))

  if (settingsQuery.isLoading || deenQuery.isLoading) {
    return <div className="py-20 text-center text-gray-400">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">40-Day History</h1>
        {cycleDay !== null && (
          <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-bold text-primary-800">
            {cycleComplete ? 'Cycle Complete' : `Day ${cycleDay}/40`}
          </span>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Overall" value={`${overall.percentage}%`} />
        <StatCard label="Fajr On-time" value={`${adherence['fajr_ontime']?.percentage ?? 0}%`} />
        <StatCard label="Fajr Streak" value={`${fajrStreak.current}`} sub={`Best: ${fajrStreak.longest}`} />
        <StatCard label="Istighfar" value={`${adherence['istighfar']?.percentage ?? 0}%`} />
      </div>

      {/* Adherence breakdown */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Adherence Breakdown</h2>
        <div className="space-y-2">
          {Object.entries(adherence)
            .filter(([k]) => k !== 'fajr_ontime')
            .map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-28 text-sm capitalize text-gray-600">{key.replace(/_/g, ' ')}</span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${val.percentage}%` }} />
                  </div>
                </div>
                <span className="w-12 text-right text-sm font-semibold tabular-nums">{val.percentage}%</span>
              </div>
            ))}
        </div>
      </section>

      {/* Calendar grid */}
      {calDates.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Calendar</h2>
          <div className="grid grid-cols-7 gap-1 sm:grid-cols-10">
            {calDates.map((date, i) => {
              const d = dayMap.get(date)
              const dayNum = i + 1
              const fajr = d?.fajr ?? null
              const bg = date > today
                ? 'bg-gray-50 text-gray-300'
                : fajr === 'ontime'
                  ? 'bg-green-100 text-green-800'
                  : fajr === 'qada'
                    ? 'bg-amber-100 text-amber-800'
                    : fajr === 'missed'
                      ? 'bg-red-100 text-red-800'
                      : d
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-gray-50 text-gray-400'
              return (
                <div key={date} className={`flex h-10 w-full items-center justify-center rounded-lg text-xs font-semibold ${bg}`} title={date}>
                  {dayNum}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {cycleComplete && (
        <div className="rounded-xl bg-green-50 p-6 text-center">
          <h3 className="mb-2 text-lg font-bold text-green-800">Cycle Complete</h3>
          <p className="mb-4 text-sm text-green-700">
            Overall adherence: {overall.percentage}% over {cycleDays} days.
          </p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}
