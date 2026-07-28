import { createFileRoute, Link } from '@tanstack/react-router'
import { useOpportunities, useSettings } from '../data/queries.js'
import { getToday, isMissingNextAction, stalenessLevel } from '@nasr/shared'

export const Route = createFileRoute('/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const oppsQuery = useOpportunities()
  const settingsQuery = useSettings()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)

  const opportunities = (oppsQuery.data ?? []) as Array<any>
  const open = opportunities.filter((o: any) => o.status === 'open')

  const reviewItems = open.filter((o: any) => {
    const missing = isMissingNextAction(o)
    const stale = stalenessLevel(o.last_touch_date ?? null, today) !== null
    return missing || stale
  })

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Weekly review</h1>
          <p className="mt-1 text-sm text-zinc-500">Everything that needs attention, in one pass.</p>
        </div>
        <span className="font-mono text-xs text-zinc-600">
          {reviewItems.length} item{reviewItems.length !== 1 ? 's' : ''}
        </span>
      </header>

      {reviewItems.length === 0 ? (
        <div className="card border-emerald-500/20 bg-emerald-500/[0.04] py-16 text-center">
          <p className="text-base font-medium text-emerald-200">All clear</p>
          <p className="mt-1 text-sm text-emerald-300/60">Nothing needs attention right now.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviewItems.map((opp: any) => {
            const missing = isMissingNextAction(opp)
            const stale = stalenessLevel(opp.last_touch_date ?? null, today)
            return (
              <Link
                key={opp.id}
                to="/pipeline/$id"
                params={{ id: opp.id }}
                className="card block px-4 py-4 transition hover:border-line-strong hover:bg-elevated"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-zinc-100">{opp.name}</h3>
                    {opp.organisation && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{opp.organisation}</p>
                    )}
                  </div>
                  <span className="chip bg-elevated capitalize text-zinc-400">{opp.stage}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {missing && (
                    <span className="chip bg-amber-500/12 text-amber-300">No next action</span>
                  )}
                  {stale && (
                    <span
                      className={`chip ${
                        stale === 'red' ? 'bg-red-500/12 text-red-300' : 'bg-amber-500/12 text-amber-300'
                      }`}
                    >
                      Stale · {stale === 'red' ? '14d+' : '7d+'}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
