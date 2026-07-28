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
} from '@nasr/shared'

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
    return <p className="py-24 text-center text-sm text-zinc-600">Loading…</p>
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-zinc-500">Adherence across the 40-day cycle.</p>
        </div>
        {cycleDay !== null && (
          <span className="chip bg-primary-500/12 text-primary-300">
            {cycleComplete ? 'Cycle complete' : `Day ${cycleDay} / 40`}
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Overall" value={`${overall.percentage}%`} accent />
        <Stat label="Fajr on time" value={`${adherence['fajr_ontime']?.percentage ?? 0}%`} />
        <Stat label="Fajr streak" value={String(fajrStreak.current)} sub={`best ${fajrStreak.longest}`} />
        <Stat label="Istighfar" value={`${adherence['istighfar']?.percentage ?? 0}%`} />
      </div>

      <section className="space-y-3">
        <h2 className="label">Adherence Breakdown</h2>
        <div className="card divide-y divide-line">
          {Object.entries(adherence)
            .filter(([k]) => k !== 'fajr_ontime')
            .map(([key, val]) => (
              <div key={key} className="flex items-center gap-4 px-4 py-3">
                <span className="w-32 shrink-0 text-sm capitalize text-zinc-400">
                  {key.replace(/_/g, ' ')}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500"
                    style={{ width: `${val.percentage}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums text-zinc-400">
                  {val.percentage}%
                </span>
              </div>
            ))}
        </div>
      </section>

      {calDates.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="label">Calendar</h2>
            <Legend />
          </div>
          <div className="card p-3">
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
              {calDates.map((date, i) => {
                const d = dayMap.get(date)
                const fajr = d?.fajr ?? null
                const tone = date > today
                  ? 'bg-panel text-zinc-700 ring-1 ring-inset ring-line'
                  : fajr === 'ontime'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : fajr === 'qada'
                      ? 'bg-amber-500/15 text-amber-300'
                      : fajr === 'missed'
                        ? 'bg-red-500/15 text-red-300'
                        : d
                          ? 'bg-elevated text-zinc-400'
                          : 'bg-panel text-zinc-700 ring-1 ring-inset ring-line'
                return (
                  <div
                    key={date}
                    title={`${date} — ${fajr ?? 'not logged'}`}
                    className={`flex aspect-square items-center justify-center rounded-md font-mono text-[11px] font-medium tabular-nums ${tone}`}
                  >
                    {i + 1}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {cycleComplete && (
        <div className="card border-emerald-500/25 bg-emerald-500/8 p-6 text-center">
          <h3 className="text-base font-semibold text-emerald-200">Cycle complete</h3>
          <p className="mt-1 text-sm text-emerald-300/70">
            {overall.percentage}% overall adherence across {cycleDays} days.
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="card p-4">
      <p className="label">{label}</p>
      <p
        className={`mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight ${
          accent ? 'text-primary-300' : 'text-zinc-100'
        }`}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 font-mono text-[11px] text-zinc-600">{sub}</p>}
    </div>
  )
}

const legendItems = [
  { tone: 'bg-emerald-500/40', label: 'On time' },
  { tone: 'bg-amber-500/40', label: 'Qada' },
  { tone: 'bg-red-500/40', label: 'Missed' },
  { tone: 'bg-elevated', label: 'Logged' },
]

function Legend() {
  return (
    <div className="flex items-center gap-3">
      {legendItems.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-zinc-600">
          <span className={`h-2 w-2 rounded-[3px] ${item.tone}`} />
          {item.label}
        </span>
      ))}
    </div>
  )
}
