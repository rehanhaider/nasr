import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, json } from '../server/auth.js'
import { getDaysByRange } from '../server/services/deen.js'
import { getSettings } from '../server/services/settings.js'
import { getToday, getCycleDay, cycleDatesForDay, datesInRange } from '@nasr/shared'

export const Route = createFileRoute('/api/v1/deen/days')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const settings = getSettings()
        const today = getToday(settings.timezone)
        let startDate = url.searchParams.get('start')
        let endDate = url.searchParams.get('end')

        if (!startDate || !endDate) {
          if (settings.cycle_start_date) {
            const dates = cycleDatesForDay(settings.cycle_start_date)
            startDate = dates[0]
            endDate = dates[dates.length - 1] > today ? today : dates[dates.length - 1]
          } else {
            const d = new Date(today + 'T00:00:00Z')
            d.setUTCDate(d.getUTCDate() - 39)
            startDate = d.toISOString().slice(0, 10)
            endDate = today
          }
        }

        const days = getDaysByRange(startDate, endDate)
        const cycleDay = getCycleDay(settings.cycle_start_date, today)

        return json({ days, cycleDay, today })
      },
    },
  },
})
