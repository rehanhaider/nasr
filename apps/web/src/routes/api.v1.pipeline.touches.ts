import { createFileRoute } from '@tanstack/react-router'
import { touchCreateSchema } from '@mizan/shared'
import { requireAuth, json } from '../server/auth.js'
import { getTouchesForOpportunity, createTouch } from '../server/services/pipeline.js'

export const Route = createFileRoute('/api/v1/pipeline/touches')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const opportunityId = url.searchParams.get('opportunity_id')
        if (!opportunityId) return json({ error: 'Missing opportunity_id' }, 400)
        return json(getTouchesForOpportunity(opportunityId))
      },
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = touchCreateSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }
        return json(createTouch(parsed.data), 201)
      },
    },
  },
})
