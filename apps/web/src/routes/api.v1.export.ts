import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, json } from '../server/auth.js'
import { exportAllJson, exportDeenCsv } from '../server/services/export.js'

export const Route = createFileRoute('/api/v1/export')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const format = url.searchParams.get('format') ?? 'json'
        const now = new Date().toISOString().replace(/[:.]/g, '-')

        if (format === 'csv') {
          const csv = exportDeenCsv()
          const filename = `nasr-deen-${now}.csv`
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        }

        const data = exportAllJson()
        const filename = `nasr-export-${now}.json`
        return new Response(JSON.stringify(data, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}"`,
          },
        })
      },
    },
  },
})
