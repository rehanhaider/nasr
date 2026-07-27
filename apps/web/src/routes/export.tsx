import { createFileRoute } from '@tanstack/react-router'

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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Export Data</h1>
      <p className="text-sm text-gray-500">Download your data as JSON or CSV files.</p>

      <div className="space-y-3">
        <ExportButton label="Full JSON Export" description="All tables, all data" onClick={() => download('json')} />
        <ExportButton label="Daily Practices CSV" description="Salah, adhkar, istighfar records" onClick={() => download('csv', 'deen')} />
        <ExportButton label="Pipeline CSV" description="Opportunities and their details" onClick={() => download('csv', 'pipeline')} />
      </div>
    </div>
  )
}

function ExportButton({ label, description, onClick }: { label: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl bg-white p-5 text-left shadow-sm transition hover:shadow-md"
    >
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  )
}
