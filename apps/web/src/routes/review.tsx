import { createFileRoute, Link } from '@tanstack/react-router'
import { useOpportunities, useSettings } from '../data/queries.js'
import { getToday, isMissingNextAction, stalenessLevel } from '@mizan/shared'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Weekly Review</h1>
        <p className="text-sm text-gray-500">
          Work through everything that needs attention.
        </p>
      </div>

      {reviewItems.length === 0 ? (
        <div className="rounded-xl bg-green-50 p-8 text-center">
          <p className="text-lg font-semibold text-green-800">All clear</p>
          <p className="text-sm text-green-600">No items need attention right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviewItems.map((opp: any) => {
            const missing = isMissingNextAction(opp)
            const stale = stalenessLevel(opp.last_touch_date ?? null, today)
            return (
              <Link
                key={opp.id}
                to="/pipeline/$id"
                params={{ id: opp.id }}
                className="block rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opp.name}</h3>
                    {opp.organisation && <p className="text-sm text-gray-500">{opp.organisation}</p>}
                  </div>
                  <div className="flex gap-1">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold capitalize text-blue-800">{opp.stage}</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {missing && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      No next action
                    </span>
                  )}
                  {stale && (
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stale === 'red' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      Stale ({stale === 'red' ? '14+ days' : '7+ days'})
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="text-xs text-gray-400">
        {reviewItems.length} item{reviewItems.length !== 1 ? 's' : ''} to review
      </div>
    </div>
  )
}
