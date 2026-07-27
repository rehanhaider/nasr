import { createFileRoute } from '@tanstack/react-router'
import { extractToken, logout, json, clearSessionCookie } from '../server/auth.js'

export const Route = createFileRoute('/api/v1/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = extractToken(request)
        if (token) {
          logout(token)
        }
        return json(
          { ok: true },
          200,
          { 'Set-Cookie': clearSessionCookie() },
        )
      },
    },
  },
})
