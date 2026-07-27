import { createFileRoute } from '@tanstack/react-router'
import { loginRequestSchema } from '@mizan/shared'
import { login, isPinSet, setPin, json, makeSessionCookie } from '../server/auth.js'

export const Route = createFileRoute('/api/v1/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        const parsed = loginRequestSchema.safeParse(body)
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }

        if (!isPinSet()) {
          setPin(parsed.data.pin)
        }

        const result = login(parsed.data.pin)
        if (!result.success) {
          return json({ error: result.error, lockedOut: result.lockedOut }, 401)
        }

        return json(
          { token: result.token },
          200,
          { 'Set-Cookie': makeSessionCookie(result.token!) },
        )
      },
    },
  },
})
