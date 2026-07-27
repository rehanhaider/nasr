import { createFileRoute } from '@tanstack/react-router'
import { opportunityUpdateSchema } from '@nasr/shared'
import { requireAuth, json } from '../server/auth.js'
import {
  getOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getTouchesForOpportunity,
  getLastTouchDate,
  getWrittenOutboundCount,
} from '../server/services/pipeline.js'
import { getSettings } from '../server/services/settings.js'
import { checkGhostedEligibility, stalenessLevel, isMissingNextAction, getToday } from '@nasr/shared'

export const Route = createFileRoute('/api/v1/pipeline/opportunity/$id')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const opp = getOpportunity(params.id)
        if (!opp) return json({ error: 'Not found' }, 404)

        const settings = getSettings()
        const today = getToday(settings.timezone)
        const oppTouches = getTouchesForOpportunity(params.id)
        const lastTouch = getLastTouchDate(params.id)
        const ghostedCheck = checkGhostedEligibility(oppTouches, today)
        const staleness = stalenessLevel(lastTouch, today)
        const missingAction = isMissingNextAction(opp)

        return json({
          ...opp,
          touches: oppTouches,
          lastTouchDate: lastTouch,
          writtenOutboundCount: getWrittenOutboundCount(params.id),
          ghostedEligibility: ghostedCheck,
          staleness,
          missingNextAction: missingAction,
        })
      },
      PUT: async ({ request, params }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = opportunityUpdateSchema.safeParse({ ...body, id: params.id })
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }

        const result = updateOpportunity(parsed.data)
        if ('error' in result) {
          return json({ error: result.error }, 422)
        }
        return json(result)
      },
      DELETE: async ({ request, params }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const deleted = deleteOpportunity(params.id)
        if (!deleted) return json({ error: 'Not found' }, 404)
        return json({ ok: true })
      },
    },
  },
})
