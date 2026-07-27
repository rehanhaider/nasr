import { createFileRoute } from '@tanstack/react-router'
import { settingsUpdateSchema } from '@nasr/shared'
import { requireAuth, json } from '../server/auth.js'
import { getSettings, updateSettings } from '../server/services/settings.js'

export const Route = createFileRoute('/api/v1/settings')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied
        return json(getSettings())
      },
      PUT: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = settingsUpdateSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }
        return json(updateSettings(parsed.data))
      },
    },
  },
})
