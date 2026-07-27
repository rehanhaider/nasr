import { createFileRoute } from '@tanstack/react-router'
import { observationCreateSchema } from '@nasr/shared'
import { requireAuth, json } from '../server/auth.js'
import { getObservations, createObservation, deleteObservation } from '../server/services/deen.js'

export const Route = createFileRoute('/api/v1/deen/observations')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied
        return json(getObservations())
      },
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = observationCreateSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }
        return json(createObservation(parsed.data), 201)
      },
      DELETE: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (!id) return json({ error: 'Missing id parameter' }, 400)

        const deleted = deleteObservation(id)
        if (!deleted) return json({ error: 'Not found' }, 404)
        return json({ ok: true })
      },
    },
  },
})
