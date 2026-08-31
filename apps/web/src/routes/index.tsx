import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDeenContent, useDeenDays, useDeenDay, useSettings, useAuthStatus } from '../data/queries.js'
import { useUpdateDeenDay } from '../data/mutations.js'
import {
  getCycleDay,
  isCycleComplete,
  fajrOnTimeStreak,
  getToday,
  DEEN_GUIDES,
} from '@nasr/shared'
import type { DeenContent, DeenContentItemKey, DeenDay, PrayerStatus } from '@nasr/shared'
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

function shiftDate(date: string, days: number): string {
  const shifted = new Date(`${date}T00:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return shifted.toISOString().slice(0, 10)
}

function TodayPage() {
  const authQuery = useAuthStatus()
  const navigate = useNavigate()
  const [dayOffset, setDayOffset] = useState(0)

  useEffect(() => {
    if (authQuery.data && !authQuery.data.authenticated) {
      navigate({ to: '/login' })
    }
  }, [authQuery.data, navigate])

  const settingsQuery = useSettings()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)
  const selectedDate = shiftDate(today, dayOffset)
  const isToday = dayOffset === 0
  const deenDaysQuery = useDeenDays()
  const dayQuery = useDeenDay(selectedDate)
  const updateDay = useUpdateDeenDay()
  const contentQuery = useDeenContent()

  if (authQuery.isLoading || settingsQuery.isLoading) {
    return <p className="py-24 text-center text-sm text-zinc-600">Loading…</p>
  }

  const cycleDay = getCycleDay(settingsQuery.data?.cycle_start_date ?? null, selectedDate)
  const cycleComplete = isCycleComplete(cycleDay)
  const allDays = deenDaysQuery.data?.days ?? []
  const fajrStreak = fajrOnTimeStreak(allDays, selectedDate)
  const day = dayQuery.data

  const prayers: Array<{ key: keyof Pick<DeenDay, 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'>; label: string }> = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'dhuhr', label: 'Dhuhr' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
  ]

  const boolItems: Array<{ key: keyof Pick<DeenDay, 'morning_adhkar' | 'evening_adhkar' | 'ruqyah'>; itemKey: DeenContentItemKey }> = [
    { key: 'morning_adhkar', itemKey: 'morning_adhkar' },
    { key: 'evening_adhkar', itemKey: 'evening_adhkar' },
    { key: 'ruqyah', itemKey: 'ruqyah' },
  ]

  function togglePrayer(key: string, currentVal: PrayerStatus) {
    const cycle: Exclude<PrayerStatus, null>[] = ['ontime', 'qada', 'missed']
    const idx = currentVal === null ? -1 : cycle.indexOf(currentVal)
    const next = cycle[(idx + 1) % cycle.length]
    updateDay.mutate({ date: selectedDate, [key]: next })
  }

  function clearPrayer(key: string) {
    updateDay.mutate({ date: selectedDate, [key]: null })
  }

  function toggleBool(key: string, currentVal: boolean) {
    updateDay.mutate({ date: selectedDate, [key]: !currentVal })
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDayOffset((offset) => offset - 1)}
              aria-label="Previous day"
              className="btn btn-ghost h-9 w-9 p-0 text-lg"
            >
              ‹
            </button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{isToday ? 'Today' : 'Previous day'}</h1>
              <p className="mt-1 font-mono text-xs text-zinc-500">{selectedDate}</p>
            </div>
            <button
              type="button"
              onClick={() => setDayOffset((offset) => Math.min(0, offset + 1))}
              disabled={isToday}
              aria-label="Next day"
              className="btn btn-ghost h-9 w-9 p-0 text-lg disabled:opacity-30"
            >
              ›
            </button>
          </div>
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
              <div
                key={key}
                className="flex items-center rounded-xl border border-line bg-panel transition focus-within:border-line-strong hover:border-line-strong hover:bg-elevated"
              >
                <button
                  onClick={() => togglePrayer(key, val)}
                  className="flex flex-1 items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`h-1.5 w-1.5 rounded-full transition-colors ${statusDot[tone]}`} />
                    <span className="text-sm font-medium text-zinc-200">{label}</span>
                  </span>
                  <span className={`chip ${statusTone[tone]}`}>{statusLabel(val)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => clearPrayer(key)}
                  disabled={val === null}
                  aria-label={`Clear ${label}`}
                  className="px-3 py-3.5 text-sm text-zinc-600 transition hover:text-zinc-300 disabled:opacity-0"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="label">Daily practices</h2>
          <span className="text-xs text-zinc-600">Open a row for the recitation</span>
        </div>
        <div className="space-y-2">
          {boolItems.map(({ key, itemKey }) => {
            const val = day?.[key] ?? false
            return (
              <PracticeDisclosure
                key={key}
                itemKey={itemKey}
                complete={val}
                items={(contentQuery.data ?? []).filter((item) => item.item_key === itemKey)}
                onToggle={() => toggleBool(key, val)}
              />
            )
          })}
          <NightDisclosure
            day={day}
            items={(contentQuery.data ?? []).filter((item) => item.item_key === 'night_ayat')}
            onToggle={(key, value) => updateDay.mutate({ date: selectedDate, [key]: !value })}
          />
        </div>
      </section>

      <section className="space-y-3">
        <GuideHeading
          label="Istighfar"
          itemKey="istighfar"
          items={(contentQuery.data ?? []).filter((item) => item.item_key === 'istighfar')}
        />
        <IstighfarCounter
          count={day?.istighfar_count ?? 0}
          target={settingsQuery.data?.istighfar_target ?? 100}
          onUpdate={(count) => updateDay.mutate({ date: selectedDate, istighfar_count: count })}
        />
      </section>

      <section className="space-y-3">
        <h2 className="label">Note</h2>
        <DayNote
          note={day?.note ?? ''}
          dateLabel={isToday ? 'today' : selectedDate}
          onSave={(note) => updateDay.mutate({ date: selectedDate, note: note || null })}
        />
      </section>


    </div>
  )
}

function PracticeDisclosure({
  itemKey,
  complete,
  items,
  onToggle,
}: {
  itemKey: DeenContentItemKey
  complete: boolean
  items: DeenContent[]
  onToggle: () => void
}) {
  const [open, setOpen] = useState(false)
  const guide = DEEN_GUIDES[itemKey]

  return (
    <article className={`overflow-hidden rounded-xl border transition ${complete ? 'border-emerald-500/25 bg-emerald-500/6' : 'border-line bg-panel'}`}>
      <div className="flex min-h-14 items-stretch">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-elevated/70 active:bg-elevated"
        >
          <span className="min-w-0">
            <span className={`block text-sm font-medium ${complete ? 'text-emerald-200' : 'text-zinc-200'}`}>{guide.title}</span>
            <span className="mt-0.5 block truncate text-xs text-zinc-500">{guide.window}</span>
          </span>
          <Chevron open={open} />
        </button>
        <CompletionButton complete={complete} onClick={onToggle} label={guide.title} />
      </div>
      {open && <PracticeGuide itemKey={itemKey} items={items} />}
    </article>
  )
}

function NightDisclosure({
  day,
  items,
  onToggle,
}: {
  day: DeenDay | undefined
  items: DeenContent[]
  onToggle: (key: 'night_ayat_kursi' | 'night_baqarah' | 'night_three_suras', current: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const checks = [
    { key: 'night_ayat_kursi' as const, label: 'Ayat al-Kursi', value: day?.night_ayat_kursi ?? false },
    { key: 'night_baqarah' as const, label: 'Al-Baqarah 285–286', value: day?.night_baqarah ?? false },
    { key: 'night_three_suras' as const, label: 'Three suras + wipe', value: day?.night_three_suras ?? false },
  ]
  const completed = checks.filter((check) => check.value).length

  return (
    <article className={`overflow-hidden rounded-xl border transition ${completed === 3 ? 'border-emerald-500/25 bg-emerald-500/6' : 'border-line bg-panel'}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-elevated/70 active:bg-elevated"
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-200">
            Night recitation
            <span className="font-mono text-[11px] text-zinc-500">{completed}/3</span>
          </span>
          <span className="mt-0.5 block truncate text-xs text-zinc-500">At bedtime · tracked in three parts</span>
        </span>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="border-t border-line">
          <div className="grid gap-2 p-3 sm:grid-cols-3">
            {checks.map((check) => (
              <button
                key={check.key}
                type="button"
                onClick={() => onToggle(check.key, check.value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition active:scale-[0.99] ${check.value ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-line bg-canvas/40 text-zinc-400 hover:border-line-strong'}`}
              >
                <CheckMark complete={check.value} />
                {check.label}
              </button>
            ))}
          </div>
          <PracticeGuide itemKey="night_ayat" items={items} nested />
        </div>
      )}
    </article>
  )
}

function GuideHeading({ label, itemKey, items }: { label: string; itemKey: DeenContentItemKey; items: DeenContent[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="label">{label}</h2>
        <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex items-center gap-1.5 text-xs font-medium text-primary-300 transition hover:text-primary-200">
          {open ? 'Hide guide' : 'Open guide'}
          <Chevron open={open} />
        </button>
      </div>
      {open && <PracticeGuide itemKey={itemKey} items={items} />}
    </>
  )
}

function PracticeGuide({ itemKey, items, nested = false }: { itemKey: DeenContentItemKey; items: DeenContent[]; nested?: boolean }) {
  const guide = DEEN_GUIDES[itemKey]
  return (
    <div className={`${nested ? '' : 'border-t border-line'} bg-canvas/45 px-4 pb-5 pt-4`}>
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-primary-300">{guide.window}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-400">{guide.summary}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">Recite from the Arabic where you can. Transliteration is a rough aid; English gives the meaning.</p>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-600">Loading the recitation guide…</p>
      ) : (
        <ol className="mt-5 space-y-4">
          {items.map((item, index) => <ContentEntry key={item.id} item={item} number={index + 1} />)}
        </ol>
      )}
      {guide.closingNote && <p className="mt-5 border-l-2 border-primary-500/50 pl-3 text-xs leading-5 text-zinc-500">{guide.closingNote}</p>}
      <p className="mt-5 text-[11px] leading-5 text-zinc-600">
        Grades: <span className="text-emerald-400">sahih</span> authentic · <span className="text-sky-400">hasan</span> good and acceptable · <span className="text-amber-400">mawquf</span> reported from a Companion.
      </p>
    </div>
  )
}

function ContentEntry({ item, number }: { item: DeenContent; number: number }) {
  const gradeTone = item.grade === 'sahih' ? 'text-emerald-300 bg-emerald-500/10' : item.grade === 'hasan' ? 'text-sky-300 bg-sky-500/10' : 'text-amber-300 bg-amber-500/10'
  return (
    <li className="rounded-xl bg-panel p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="font-mono text-xs text-zinc-600">{String(number).padStart(2, '0')}</span>
          <h3 className="text-sm font-semibold leading-5 text-zinc-100">{item.title}</h3>
        </div>
        <span className="chip bg-primary-500/10 text-primary-300">{item.repetitions}</span>
      </div>
      {item.arabic && <p lang="ar" dir="rtl" className="mt-5 whitespace-pre-line text-right font-serif text-[1.65rem] leading-[2.15] text-zinc-50">{item.arabic}</p>}
      {item.transliteration && <p className="mt-4 whitespace-pre-line text-sm italic leading-6 text-zinc-400">{item.transliteration}</p>}
      {item.meaning && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-300">{item.meaning}</p>}
      {item.note && <p className="mt-3 rounded-lg bg-elevated px-3 py-2 text-xs leading-5 text-zinc-500">{item.note}</p>}
      <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-line pt-3">
        <span className={`chip uppercase tracking-wide ${gradeTone}`}>{item.grade}</span>
        <p className="min-w-0 flex-1 text-xs leading-5 text-zinc-600">{item.reference}</p>
      </div>
    </li>
  )
}

function CompletionButton({ complete, onClick, label }: { complete: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={`${complete ? 'Mark incomplete' : 'Mark complete'}: ${label}`} className="flex w-16 shrink-0 items-center justify-center border-l border-line transition hover:bg-elevated active:bg-line">
      <CheckMark complete={complete} />
    </button>
  )
}

function CheckMark({ complete }: { complete: boolean }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition ${complete ? 'border-emerald-400 bg-emerald-400 text-canvas' : 'border-line-strong bg-canvas/40'}`}>
      {complete && <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2.5 6.2 4.8 8.5 9.5 3.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </span>
  )
}

function Chevron({ open }: { open: boolean }) {
  return <svg viewBox="0 0 16 16" aria-hidden className={`h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m4 6 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
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

function DayNote({ note, dateLabel, onSave }: { note: string; dateLabel: string; onSave: (n: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note)

  useEffect(() => { setText(note) }, [note])

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="card w-full px-4 py-3.5 text-left text-sm text-zinc-400 transition hover:border-line-strong hover:bg-elevated"
      >
        {note || <span className="text-zinc-600">Add a note for {dateLabel}…</span>}
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
