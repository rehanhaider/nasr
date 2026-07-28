import { createFileRoute } from '@tanstack/react-router'
import { resetRequestSchema } from '@nasr/shared'
import { requireAuth, extractToken, json } from '../server/auth.js'
import { resetData } from '../server/services/reset.js'

export const Route = createFileRoute('/api/v1/settings/reset')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json().catch(() => null)
        const parsed = resetRequestSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Send { "confirm": "RESET" } to reset.' }, 400)
        }

        return json(resetData(extractToken(request)))
      },
    },
  },
})
