import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useDeenDays, useDeenDay, useSettings, useOpportunities, useAuthStatus } from '../data/queries.js'
import { useUpdateDeenDay } from '../data/mutations.js'
import {
  getCycleDay,
  isCycleComplete,
  fajrOnTimeStreak,
  getToday,
  isMissingNextAction,
} from '@nasr/shared'
import type { DeenDay, PrayerStatus } from '@nasr/shared'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: TodayPage,
})

const statusTone: Record<string, string> = {
  ontime: 'bg-emerald-500/12 text-emerald-300',
  qada: 'bg-amber-500/12 text-amber-300',
  missed: 'bg-red-500/12 text-red-300',
  none: 'bg-elevated text-zinc-500',
}

const statusDot: Record<string, string> = {
  ontime: 'bg-emerald-400',
  qada: 'bg-amber-400',
  missed: 'bg-red-400',
  none: 'bg-zinc-700',
}

function TodayPage() {
  const authQuery = useAuthStatus()
  const navigate = useNavigate()

  useEffect(() => {
    if (authQuery.data && !authQuery.data.authenticated) {
      navigate({ to: '/login' })
    }
  }, [authQuery.data, navigate])

  const settingsQuery = useSettings()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)
  const deenDaysQuery = useDeenDays()
  const dayQuery = useDeenDay(today)
  const updateDay = useUpdateDeenDay()
  const oppsQuery = useOpportunities()

  if (authQuery.isLoading || settingsQuery.isLoading) {
    return <p className="py-24 text-center text-sm text-zinc-600">Loading…</p>
  }

  const cycleDay = getCycleDay(settingsQuery.data?.cycle_start_date ?? null, today)
  const cycleComplete = isCycleComplete(cycleDay)
  const allDays = deenDaysQuery.data?.days ?? []
  const fajrStreak = fajrOnTimeStreak(allDays, today)
  const day = dayQuery.data

  const opportunities = oppsQuery.data ?? []
  const openOpps = opportunities.filter((o) => o.status === 'open')
  const needsAction = openOpps.filter((o) => isMissingNextAction(o))

  const prayers: Array<{ key: keyof Pick<DeenDay, 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'>; label: string }> = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'dhuhr', label: 'Dhuhr' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
  ]

  const boolItems: Array<{ key: keyof Pick<DeenDay, 'morning_adhkar' | 'evening_adhkar' | 'night_ayat' | 'ruqyah'>; label: string }> = [
    { key: 'morning_adhkar', label: 'Morning Adhkar' },
    { key: 'evening_adhkar', label: 'Evening Adhkar' },
    { key: 'night_ayat', label: 'Night Ayat' },
    { key: 'ruqyah', label: 'Self-Ruqyah' },
  ]

  function togglePrayer(key: string, currentVal: PrayerStatus) {
    const cycle: PrayerStatus[] = [null, 'ontime', 'qada', 'missed']
    const idx = cycle.indexOf(currentVal)
    const next = cycle[(idx + 1) % cycle.length]
    updateDay.mutate({ date: today, [key]: next })
  }

  function toggleBool(key: string, currentVal: boolean) {
    updateDay.mutate({ date: today, [key]: !currentVal })
  }

  function statusLabel(val: PrayerStatus): string {
    if (val === 'ontime') return 'On time'
    if (val === 'qada') return 'Qada'
    if (val === 'missed') return 'Missed'
    return 'Not set'
  }

  const logged = prayers.filter(({ key }) => (day?.[key] ?? null) !== null).length

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="mt-1 font-mono text-xs text-zinc-500">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          {cycleDay !== null && (
            <span className="chip bg-primary-500/12 text-primary-300">
              {cycleComplete ? 'Cycle complete' : `Day ${cycleDay} / 40`}
            </span>
          )}
          <span className="chip bg-elevated text-zinc-400">
            <span className="h-1 w-1 rounded-full bg-emerald-400" />
            {fajrStreak.current}d Fajr streak
          </span>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Salah</h2>
          <span className="font-mono text-xs text-zinc-600">{logged}/5 logged</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {prayers.map(({ key, label }) => {
            const val = (day?.[key] ?? null) as PrayerStatus
            const tone = val ?? 'none'
            return (
              <button
                key={key}
                onClick={() => togglePrayer(key, val)}
                className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3.5 text-left transition hover:border-line-strong hover:bg-elevated"
              >
                <span className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full transition-colors ${statusDot[tone]}`} />
                  <span className="text-sm font-medium text-zinc-200">{label}</span>
                </span>
                <span className={`chip ${statusTone[tone]}`}>{statusLabel(val)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="label">Daily Practices</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {boolItems.map(({ key, label }) => {
            const val = day?.[key] ?? false
            return (
              <button
                key={key}
                onClick={() => toggleBool(key, val)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                  val
                    ? 'border-emerald-500/25 bg-emerald-500/8'
                    : 'border-line bg-panel hover:border-line-strong hover:bg-elevated'
                }`}
              >
                <span
                  className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border transition ${
                    val ? 'border-emerald-400 bg-emerald-400 text-canvas' : 'border-line-strong'
                  }`}
                >
                  {val && (
                    <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm font-medium ${val ? 'text-emerald-200' : 'text-zinc-300'}`}>{label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="label">Istighfar</h2>
        <IstighfarCounter
          count={day?.istighfar_count ?? 0}
          target={settingsQuery.data?.istighfar_target ?? 100}
          onUpdate={(count) => updateDay.mutate({ date: today, istighfar_count: count })}
        />
      </section>

      <section className="space-y-3">
        <h2 className="label">Note</h2>
        <DayNote
          note={day?.note ?? ''}
          onSave={(note) => updateDay.mutate({ date: today, note: note || null })}
        />
      </section>

      {needsAction.length > 0 && (
        <section className="space-y-3">
          <h2 className="label">Pipeline Alerts</h2>
          <div className="card divide-y divide-line overflow-hidden">
            {needsAction.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                to="/pipeline/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-elevated"
              >
                <span className="truncate text-sm font-medium text-zinc-200">{o.name}</span>
                <span className="chip shrink-0 bg-amber-500/12 text-amber-300">No next action</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function IstighfarCounter({ count, target, onUpdate }: { count: number; target: number; onUpdate: (n: number) => void }) {
  const pct = Math.min(100, Math.round((count / target) * 100))
  return (
    <div className="card p-5">
      <div className="flex items-end justify-between">
        <span className="font-mono text-4xl font-semibold tabular-nums tracking-tight text-zinc-50">
          {count}
        </span>
        <span className="font-mono text-xs text-zinc-500">
          {pct}% of {target}
        </span>
      </div>

      <div className="my-4 h-1 overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-2">
        {[1, 10, 33].map((step) => (
          <button
            key={step}
            onClick={() => onUpdate(count + step)}
            className="btn btn-secondary flex-1 font-mono"
          >
            +{step}
          </button>
        ))}
        <button
          onClick={() => onUpdate(Math.max(0, count - 1))}
          disabled={count === 0}
          className="btn btn-ghost font-mono"
          aria-label="Decrement istighfar count"
        >
          −1
        </button>
      </div>
    </div>
  )
}

function DayNote({ note, onSave }: { note: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note)

  useEffect(() => { setText(note) }, [note])

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="card w-full px-4 py-3.5 text-left text-sm text-zinc-400 transition hover:border-line-strong hover:bg-elevated"
      >
        {note || <span className="text-zinc-600">Add a note for today…</span>}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        rows={3}
        className="input resize-none"
        placeholder="What happened today?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={() => { onSave(text); setEditing(false) }} className="btn btn-primary btn-sm">
          Save
        </button>
        <button onClick={() => { setText(note); setEditing(false) }} className="btn btn-ghost btn-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
