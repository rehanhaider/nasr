import { createFileRoute } from '@tanstack/react-router'
import { extractToken, validateSession, isPinSet, json } from '../server/auth.js'

export const Route = createFileRoute('/api/v1/auth/status')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractToken(request)
        const authenticated = !!token && validateSession(token)
        return json({ authenticated, pinSet: isPinSet() })
      },
    },
  },
})
