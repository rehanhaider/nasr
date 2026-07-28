import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/export')({
  component: ExportPage,
})

function ExportPage() {
  function download(format: string, module?: string) {
    const params = new URLSearchParams({ format })
    if (module) params.set('module', module)
    window.open(`/api/v1/export?${params}`, '_blank')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-4">
        <Link to="/settings" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-200">
          <span aria-hidden>←</span> Settings
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Export</h1>
          <p className="mt-1 text-sm text-zinc-500">Your data, in formats you can read without this app.</p>
        </div>
      </header>

      <div className="card divide-y divide-line">
        <ExportRow
          label="Full JSON export"
          description="Every table, every row"
          badge="json"
          onClick={() => download('json')}
        />
        <ExportRow
          label="Daily practices"
          description="Salah, adhkar and istighfar records"
          badge="csv"
          onClick={() => download('csv', 'deen')}
        />
        <ExportRow
          label="Pipeline"
          description="Opportunities and their details"
          badge="csv"
          onClick={() => download('csv', 'pipeline')}
        />
      </div>
    </div>
  )
}

function ExportRow({
  label,
  description,
  badge,
  onClick,
}: {
  label: string
  description: string
  badge: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition hover:bg-elevated"
    >
      <span>
        <span className="block text-sm font-medium text-zinc-200">{label}</span>
        <span className="block text-xs text-zinc-500">{description}</span>
      </span>
      <span className="chip shrink-0 bg-elevated font-mono text-zinc-400">{badge}</span>
    </button>
  )
}
