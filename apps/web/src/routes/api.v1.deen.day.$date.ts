import { createFileRoute } from '@tanstack/react-router'
import { deenDayUpdateSchema } from '@mizan/shared'
import { requireAuth, json } from '../server/auth.js'
import { getDay, upsertDay } from '../server/services/deen.js'

export const Route = createFileRoute('/api/v1/deen/day/$date')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const day = getDay(params.date)
        if (!day) {
          return json({
            date: params.date,
            fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null,
            morning_adhkar: false, evening_adhkar: false, night_ayat: false, ruqyah: false,
            istighfar_count: 0, note: null,
          })
        }
        return json(day)
      },
      PUT: async ({ request, params }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const body = await request.json()
        const parsed = deenDayUpdateSchema.safeParse({ ...body, date: params.date })
        if (!parsed.success) {
          return json({ error: 'Invalid request', details: parsed.error.flatten() }, 400)
        }
        return json(upsertDay(parsed.data))
      },
    },
  },
})
