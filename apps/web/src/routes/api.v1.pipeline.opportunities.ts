import { createFileRoute } from '@tanstack/react-router'
import { opportunityCreateSchema } from '@nasr/shared'
import { requireAuth, json } from '../server/auth.js'
import { getOpportunities, createOpportunity } from '../server/services/pipeline.js'

export const Route = createFileRoute('/api/v1/pipeline/opportunities')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied
        return json(getOpportunities())
      },
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = opportunityCreateSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }
        return json(createOpportunity(parsed.data), 201)
      },
    },
  },
})
