import { createFileRoute, Link } from '@tanstack/react-router'
import { useOpportunities, useSettings } from '../data/queries.js'
import {
  getPipelineDay,
  isPipelineWindowComplete,
  getToday,
  stalenessLevel,
  isMissingNextAction,
} from '@nasr/shared'
import type { Opportunity, OpportunityStage } from '@nasr/shared'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table'
import { useState, useMemo } from 'react'

export const Route = createFileRoute('/pipeline/')({
  component: PipelinePage,
})

interface EnrichedOpp extends Opportunity {
  last_touch_date: string | null
  written_outbound_count: number
  staleness: 'amber' | 'red' | null
}

const col = createColumnHelper<EnrichedOpp>()

const statusTone: Record<string, string> = {
  open: 'bg-primary-500/12 text-primary-300',
  won: 'bg-emerald-500/12 text-emerald-300',
  lost: 'bg-red-500/12 text-red-300',
  ghosted: 'bg-elevated text-zinc-400',
  withdrawn: 'bg-amber-500/12 text-amber-300',
}

function PipelinePage() {
  const oppsQuery = useOpportunities()
  const settingsQuery = useSettings()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)
  const pipelineDay = getPipelineDay(settingsQuery.data?.pipeline_start_date ?? null, today)
  const pipelineDone = isPipelineWindowComplete(pipelineDay)
  const liveTarget = settingsQuery.data?.live_target ?? 10

  const opportunities = oppsQuery.data ?? []
  const enriched = useMemo(
    () => opportunities.map((o: any) => ({
      ...o,
      staleness: o.status === 'open' ? stalenessLevel(o.last_touch_date ?? null, today) : null,
    })),
    [opportunities, today],
  )

  const open = opportunities.filter((o) => o.status === 'open')
  const closed = opportunities.filter((o) => o.status !== 'open')
  const missingAction = open.filter((o) => isMissingNextAction(o))
  const won = closed.filter((o) => o.status === 'won').length
  const lost = closed.filter((o) => o.status === 'lost').length
  const ghosted = closed.filter((o) => o.status === 'ghosted').length
  const withdrawn = closed.filter((o) => o.status === 'withdrawn').length
  const ghostRate = closed.length > 0 ? Math.round((ghosted / closed.length) * 100) : 0

  const stages: OpportunityStage[] = ['lead', 'conversation', 'proposal', 'commitment']
  const funnel = stages.map((s) => ({ stage: s, count: open.filter((o) => o.stage === s).length }))

  const stale = enriched.filter((o) => o.status === 'open' && o.staleness !== null)
  const thinFollowUp = enriched.filter((o) => o.status === 'open' && (o.written_outbound_count ?? 0) < 2)

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const columns = useMemo(() => [
    col.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <Link
          to="/pipeline/$id"
          params={{ id: info.row.original.id }}
          className="font-medium text-zinc-100 transition hover:text-primary-300"
        >
          {info.getValue()}
        </Link>
      ),
    }),
    col.accessor('organisation', {
      header: 'Organisation',
      cell: (info) => <span className="text-zinc-400">{info.getValue() ?? '—'}</span>,
    }),
    col.accessor('stage', {
      header: 'Stage',
      cell: (info) => <span className="capitalize text-zinc-400">{info.getValue()}</span>,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const v = info.getValue()
        return <span className={`chip ${statusTone[v] ?? 'bg-elevated text-zinc-400'}`}>{v}</span>
      },
    }),
    col.accessor('next_action_date', {
      header: 'Next action',
      cell: (info) =>
        info.getValue()
          ? <span className="font-mono text-xs text-zinc-400">{info.getValue()}</span>
          : <span className="text-xs text-amber-400/70">Not set</span>,
    }),
  ], [])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return enriched
    return enriched.filter((o) => o.status === statusFilter)
  }, [enriched, statusFilter])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const openPct = Math.min(100, Math.round((open.length / liveTarget) * 100))

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {pipelineDay !== null
              ? pipelineDone ? '90-day window complete' : `Day ${pipelineDay} of 90`
              : 'No window start date set'}
          </p>
        </div>
        <Link to="/pipeline/new" className="btn btn-primary">
          New opportunity
        </Link>
      </header>

      {/* Open conversations vs target */}
      <div className="card p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="label">Open conversations</p>
            <p className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight text-zinc-50">
              {open.length}
              <span className="ml-1 text-base font-normal text-zinc-600">/ {liveTarget}</span>
            </p>
          </div>
          <span className="font-mono text-xs text-zinc-500">{openPct}%</span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${openPct}%` }}
          />
        </div>
      </div>

      {/* Funnel */}
      <section className="space-y-3">
        <h2 className="label">Open by stage</h2>
        <div className="card grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {funnel.map((f) => (
            <div key={f.stage} className="px-4 py-3.5">
              <p className="text-xs capitalize text-zinc-500">{f.stage}</p>
              <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-zinc-100">{f.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="space-y-3">
        <h2 className="label">Outcomes</h2>
        <div className="card grid grid-cols-2 divide-line sm:grid-cols-5 sm:divide-x">
          <Outcome label="Won" value={won} tone="text-emerald-300" />
          <Outcome label="Lost" value={lost} tone="text-red-300" />
          <Outcome label="Ghosted" value={ghosted} tone="text-zinc-300" />
          <Outcome label="Withdrawn" value={withdrawn} tone="text-amber-300" />
          <Outcome label="Ghost rate" value={`${ghostRate}%`} tone="text-zinc-300" />
        </div>
      </section>

      {/* Flags */}
      {(missingAction.length > 0 || stale.length > 0 || thinFollowUp.length > 0) && (
        <section className="space-y-3">
          <h2 className="label">Needs attention</h2>
          <div className="grid items-start gap-2 lg:grid-cols-3">
            <FlagPanel
              title="No next action"
              tone="amber"
              items={missingAction.map((o) => ({ id: o.id, label: o.name }))}
            />
            <FlagPanel
              title="Stale"
              tone="red"
              items={stale.map((o) => ({
                id: o.id,
                label: o.name,
                hint: o.staleness === 'red' ? '14d+' : '7d+',
              }))}
            />
            <FlagPanel
              title="Under 2 written follow-ups"
              tone="primary"
              items={thinFollowUp.map((o) => ({
                id: o.id,
                label: o.name,
                hint: `${o.written_outbound_count ?? 0}`,
              }))}
            />
          </div>
        </section>
      )}

      {/* Filters + table */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-line bg-panel p-1">
          {['all', 'open', 'won', 'lost', 'ghosted', 'withdrawn'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                statusFilter === s
                  ? 'bg-elevated text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="border-b border-line">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        onClick={h.column.getToggleSortingHandler()}
                        className="cursor-pointer select-none whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500 transition hover:text-zinc-300"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <span className="text-zinc-600">
                          {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-line/60 transition last:border-0 hover:bg-elevated">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {table.getRowModel().rows.length === 0 && (
            <p className="py-16 text-center text-sm text-zinc-600">No opportunities found.</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Outcome({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 font-mono text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

const flagTone = {
  amber: 'text-amber-300',
  red: 'text-red-300',
  primary: 'text-primary-300',
} as const

function FlagPanel({
  title,
  tone,
  items,
}: {
  title: string
  tone: keyof typeof flagTone
  items: Array<{ id: string; label: string; hint?: string }>
}) {
  if (items.length === 0) return null
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className={`text-xs font-semibold ${flagTone[tone]}`}>{title}</span>
        <span className="font-mono text-xs text-zinc-600">{items.length}</span>
      </div>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <Link
            key={item.id}
            to="/pipeline/$id"
            params={{ id: item.id }}
            className="flex items-center justify-between gap-3 px-4 py-2.5 transition hover:bg-elevated"
          >
            <span className="truncate text-sm text-zinc-300">{item.label}</span>
            {item.hint && <span className="shrink-0 font-mono text-[11px] text-zinc-600">{item.hint}</span>}
          </Link>
        ))}
      </div>
    </div>
  )
}
