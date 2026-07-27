import { createFileRoute, Link } from '@tanstack/react-router'
import { useOpportunities, useSettings } from '../data/queries.js'
import {
  getPipelineDay,
  isPipelineWindowComplete,
  getToday,
  stalenessLevel,
  isMissingNextAction,
} from '@mizan/shared'
import type { Opportunity, OpportunityStage } from '@mizan/shared'
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

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const columns = useMemo(() => [
    col.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <Link to="/pipeline/$id" params={{ id: info.row.original.id }} className="font-medium text-primary-600 hover:underline">
          {info.getValue()}
        </Link>
      ),
    }),
    col.accessor('organisation', { header: 'Organisation' }),
    col.accessor('stage', {
      header: 'Stage',
      cell: (info) => <span className="capitalize">{info.getValue()}</span>,
    }),
    col.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const v = info.getValue()
        const colors: Record<string, string> = {
          open: 'bg-blue-100 text-blue-800',
          won: 'bg-green-100 text-green-800',
          lost: 'bg-red-100 text-red-800',
          ghosted: 'bg-gray-100 text-gray-800',
          withdrawn: 'bg-amber-100 text-amber-800',
        }
        return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[v] ?? ''}`}>{v}</span>
      },
    }),
    col.accessor('next_action_date', {
      header: 'Next Action',
      cell: (info) => info.getValue() ?? <span className="text-amber-500">Not set</span>,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          {pipelineDay !== null && (
            <p className="text-sm text-gray-500">
              {pipelineDone ? '90-day window complete' : `Day ${pipelineDay} of 90`}
            </p>
          )}
        </div>
        <Link to="/pipeline/new" className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700">
          + New
        </Link>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="mb-1 flex justify-between text-sm">
          <span className="font-medium">Open Conversations</span>
          <span className="font-bold">{open.length} / {liveTarget}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${Math.min(100, (open.length / liveTarget) * 100)}%` }} />
        </div>
      </div>

      {/* Funnel + outcomes */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {funnel.map((f) => (
          <div key={f.stage} className="rounded-xl bg-white p-3 text-center shadow-sm">
            <p className="text-xs capitalize text-gray-500">{f.stage}</p>
            <p className="text-xl font-bold">{f.count}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MiniStat label="Won" value={won} color="text-green-600" />
        <MiniStat label="Lost" value={lost} color="text-red-600" />
        <MiniStat label="Ghosted" value={ghosted} color="text-gray-600" />
        <MiniStat label="Withdrawn" value={withdrawn} color="text-amber-600" />
        <MiniStat label="Ghost Rate" value={`${ghostRate}%`} color="text-gray-600" />
      </div>

      {/* Flags */}
      {missingAction.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-amber-800">No Next Action ({missingAction.length})</h3>
          {missingAction.map((o) => (
            <Link key={o.id} to="/pipeline/$id" params={{ id: o.id }} className="block text-sm text-amber-700 hover:underline">
              {o.name}
            </Link>
          ))}
        </div>
      )}
      {enriched.filter((o) => o.status === 'open' && o.staleness !== null).length > 0 && (
        <div className="rounded-xl bg-red-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-red-800">
            Stale ({enriched.filter((o) => o.status === 'open' && o.staleness !== null).length})
          </h3>
          {enriched.filter((o) => o.status === 'open' && o.staleness !== null).map((o) => (
            <Link key={o.id} to="/pipeline/$id" params={{ id: o.id }} className="block text-sm text-red-700 hover:underline">
              {o.name} <span className="text-xs">({o.staleness === 'red' ? '14+ days' : '7+ days'})</span>
            </Link>
          ))}
        </div>
      )}
      {enriched.filter((o) => o.status === 'open' && (o.written_outbound_count ?? 0) < 2).length > 0 && (
        <div className="rounded-xl bg-blue-50 p-4">
          <h3 className="mb-1 text-sm font-semibold text-blue-800">
            {'< 2 Written Follow-ups'} ({enriched.filter((o) => o.status === 'open' && (o.written_outbound_count ?? 0) < 2).length})
          </h3>
          {enriched.filter((o) => o.status === 'open' && (o.written_outbound_count ?? 0) < 2).map((o) => (
            <Link key={o.id} to="/pipeline/$id" params={{ id: o.id }} className="block text-sm text-blue-700 hover:underline">
              {o.name}
            </Link>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'open', 'won', 'lost', 'ghosted', 'withdrawn'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-gray-100">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 select-none"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' ↑', desc: ' ↓' }[h.column.getIsSorted() as string] ?? ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && (
          <p className="py-12 text-center text-gray-400">No opportunities found</p>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  )
}
