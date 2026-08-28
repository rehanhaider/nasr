import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, json } from '../server/auth.js'
import { getDeenContent } from '../server/services/content.js'

export const Route = createFileRoute('/api/v1/deen/content')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied
        return json(getDeenContent())
      },
    },
  },
})
