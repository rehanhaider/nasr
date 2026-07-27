import { createFileRoute } from '@tanstack/react-router'
import { sadaqahCreateSchema } from '@mizan/shared'
import { requireAuth, json } from '../server/auth.js'
import { getSadaqahEntries, createSadaqah } from '../server/services/deen.js'

export const Route = createFileRoute('/api/v1/deen/sadaqah')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const start = url.searchParams.get('start') ?? undefined
        const end = url.searchParams.get('end') ?? undefined
        return json(getSadaqahEntries(start, end))
      },
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = sadaqahCreateSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }
        return json(createSadaqah(parsed.data), 201)
      },
    },
  },
})
