import { createFileRoute } from '@tanstack/react-router'
import { requireAuth, json } from '../server/auth.js'
import { exportAllJson, exportDeenCsv, exportPipelineCsv } from '../server/services/export.js'

export const Route = createFileRoute('/api/v1/export')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = requireAuth(request)
        if (denied) return denied

        const url = new URL(request.url)
        const format = url.searchParams.get('format') ?? 'json'
        const module = url.searchParams.get('module')
        const now = new Date().toISOString().replace(/[:.]/g, '-')

        if (format === 'csv') {
          const csv = module === 'pipeline' ? exportPipelineCsv() : exportDeenCsv()
          const filename = `mizan-${module ?? 'deen'}-${now}.csv`
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        }

        const data = exportAllJson()
        const filename = `mizan-export-${now}.json`
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
