import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDeenDays, useDeenDay, useSettings, useOpportunities, useAuthStatus } from '../data/queries.js'
import { useUpdateDeenDay, useCreateSadaqah } from '../data/mutations.js'
import {
  getCycleDay,
  isCycleComplete,
  fajrOnTimeStreak,
  getToday,
  isMissingNextAction,
  stalenessLevel,
} from '@mizan/shared'
import type { DeenDay, PrayerStatus } from '@mizan/shared'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: TodayPage,
})

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
    return <div className="py-20 text-center text-gray-400">Loading...</div>
  }

  const cycleDay = getCycleDay(settingsQuery.data?.cycle_start_date ?? null, today)
  const cycleComplete = isCycleComplete(cycleDay)
  const allDays = deenDaysQuery.data?.days ?? []
  const fajrStreak = fajrOnTimeStreak(allDays, today)
  const day = dayQuery.data

  const opportunities = oppsQuery.data ?? []
  const openOpps = opportunities.filter((o) => o.status === 'open')

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

  function statusColor(val: PrayerStatus): string {
    if (val === 'ontime') return 'bg-green-500 text-white'
    if (val === 'qada') return 'bg-amber-500 text-white'
    if (val === 'missed') return 'bg-red-500 text-white'
    return 'bg-gray-100 text-gray-400'
  }

  function statusLabel(val: PrayerStatus): string {
    if (val === 'ontime') return 'On Time'
    if (val === 'qada') return 'Qada'
    if (val === 'missed') return 'Missed'
    return 'Tap'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Today</h1>
          <p className="text-sm text-gray-500">{today}</p>
        </div>
        <div className="text-right">
          {cycleDay !== null && (
            <div className="text-lg font-bold text-primary-700">
              {cycleComplete ? 'Cycle Complete' : `Day ${cycleDay} of 40`}
            </div>
          )}
          <div className="text-sm text-gray-500">
            Fajr streak: <span className="font-bold text-green-600">{fajrStreak.current}</span> days
          </div>
        </div>
      </div>

      {/* Prayer checklist */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Salah</h2>
        <div className="space-y-2">
          {prayers.map(({ key, label }) => {
            const val = (day?.[key] ?? null) as PrayerStatus
            return (
              <button
                key={key}
                onClick={() => togglePrayer(key, val)}
                className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition active:scale-[0.98] ${statusColor(val)}`}
              >
                <span className="text-lg font-medium">{label}</span>
                <span className="text-sm font-semibold">{statusLabel(val)}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Boolean checklist */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Daily Practices</h2>
        <div className="space-y-2">
          {boolItems.map(({ key, label }) => {
            const val = day?.[key] ?? false
            return (
              <button
                key={key}
                onClick={() => toggleBool(key, val)}
                className={`flex w-full items-center justify-between rounded-xl px-5 py-4 text-left transition active:scale-[0.98] ${val ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                <span className="text-lg font-medium">{label}</span>
                <span className="text-sm font-semibold">{val ? 'Done' : 'Tap'}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Istighfar counter */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Istighfar</h2>
        <IstighfarCounter
          count={day?.istighfar_count ?? 0}
          target={settingsQuery.data?.istighfar_target ?? 100}
          onUpdate={(count) => updateDay.mutate({ date: today, istighfar_count: count })}
        />
      </section>

      {/* Day note */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Note</h2>
        <DayNote
          note={day?.note ?? ''}
          onSave={(note) => updateDay.mutate({ date: today, note: note || null })}
        />
      </section>

      {/* Pipeline mini flags */}
      {openOpps.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Pipeline Alerts</h2>
          <div className="space-y-1">
            {openOpps.filter((o) => isMissingNextAction(o)).slice(0, 3).map((o) => (
              <div key={o.id} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <span className="font-medium">{o.name}</span> — no next action set
              </div>
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
    <div className="rounded-xl bg-gray-100 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-3xl font-bold tabular-nums">{count}</span>
        <span className="text-sm text-gray-500">/ {target}</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onUpdate(count + 1)} className="flex-1 rounded-lg bg-primary-600 py-3 text-lg font-bold text-white active:bg-primary-700">
          +1
        </button>
        <button onClick={() => onUpdate(count + 10)} className="flex-1 rounded-lg bg-primary-500 py-3 text-lg font-bold text-white active:bg-primary-600">
          +10
        </button>
        <button onClick={() => onUpdate(count + 33)} className="flex-1 rounded-lg bg-primary-400 py-3 text-lg font-bold text-white active:bg-primary-500">
          +33
        </button>
        {count > 0 && (
          <button onClick={() => onUpdate(Math.max(0, count - 1))} className="rounded-lg bg-gray-200 px-4 py-3 text-gray-600 active:bg-gray-300">
            -1
          </button>
        )}
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
        className="w-full rounded-xl bg-gray-100 px-4 py-3 text-left text-sm text-gray-500"
      >
        {note || 'Tap to add a note for today...'}
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <textarea
        autoFocus
        rows={3}
        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={() => { onSave(text); setEditing(false) }} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white">
          Save
        </button>
        <button onClick={() => { setText(note); setEditing(false) }} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-600">
          Cancel
        </button>
      </div>
    </div>
  )
}
