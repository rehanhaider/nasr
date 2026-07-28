import type { ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSettings } from '../data/queries.js'
import { useUpdateSettings, useLogout, useResetData } from '../data/mutations.js'
import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const settingsQuery = useSettings()
  const updateSettings = useUpdateSettings()
  const logout = useLogout()

  const s = settingsQuery.data

  const form = useForm({
    defaultValues: {
      timezone: s?.timezone ?? 'Asia/Kolkata',
      cycle_start_date: s?.cycle_start_date ?? '',
      pipeline_start_date: s?.pipeline_start_date ?? '',
      istighfar_target: String(s?.istighfar_target ?? 100),
      live_target: String(s?.live_target ?? 10),
    },
    onSubmit: async ({ value }) => {
      updateSettings.mutate({
        timezone: value.timezone,
        cycle_start_date: value.cycle_start_date || null,
        pipeline_start_date: value.pipeline_start_date || null,
        istighfar_target: parseInt(value.istighfar_target, 10),
        live_target: parseInt(value.live_target, 10),
      })
    },
  })

  if (settingsQuery.isLoading) {
    return <p className="py-24 text-center text-sm text-zinc-600">Loading…</p>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">Targets, dates and the clock everything is measured against.</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <div className="card divide-y divide-line">
          <Row label="Timezone" hint="e.g. Asia/Kolkata, America/New_York">
            <form.Field
              name="timezone"
              children={(field) => (
                <input
                  type="text"
                  className="input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </Row>

          <Row label="40-day cycle start">
            <form.Field
              name="cycle_start_date"
              children={(field) => (
                <input
                  type="date"
                  className="input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </Row>

          <Row label="90-day pipeline start">
            <form.Field
              name="pipeline_start_date"
              children={(field) => (
                <input
                  type="date"
                  className="input"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </Row>

          <Row label="Istighfar daily target">
            <form.Field
              name="istighfar_target"
              children={(field) => (
                <input
                  type="number"
                  min="1"
                  className="input font-mono"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </Row>

          <Row label="Open conversations target">
            <form.Field
              name="live_target"
              children={(field) => (
                <input
                  type="number"
                  min="1"
                  className="input font-mono"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </Row>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={updateSettings.isPending} className="btn btn-primary">
            {updateSettings.isPending ? 'Saving…' : 'Save settings'}
          </button>
          {updateSettings.isSuccess && (
            <span className="text-xs text-emerald-400">Saved.</span>
          )}
        </div>
      </form>

      <section className="space-y-3">
        <h2 className="label">Data</h2>
        <Link
          to="/export"
          className="card flex items-center justify-between px-4 py-3.5 transition hover:border-line-strong hover:bg-elevated"
        >
          <span>
            <span className="block text-sm font-medium text-zinc-200">Export</span>
            <span className="block text-xs text-zinc-500">Download everything as JSON or CSV</span>
          </span>
          <span aria-hidden className="text-zinc-600">→</span>
        </Link>
      </section>

      <ResetSection />

      <section className="space-y-3">
        <h2 className="label">Account</h2>
        <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <span>
            <span className="block text-sm font-medium text-zinc-200">Log out</span>
            <span className="block text-xs text-zinc-500">Ends this session on this device</span>
          </span>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => { window.location.href = '/login' } })}
            disabled={logout.isPending}
            className="btn btn-danger btn-sm"
          >
            {logout.isPending ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </section>
    </div>
  )
}

function ResetSection() {
  const reset = useResetData()
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')

  const armed = typed === 'RESET'

  function cancel() {
    setConfirming(false)
    setTyped('')
    reset.reset()
  }

  if (reset.isSuccess) {
    const cleared = Object.entries(reset.data.deleted).filter(([, n]) => n > 0)
    return (
      <section className="space-y-3">
        <h2 className="label">Danger zone</h2>
        <div className="card space-y-3 border-emerald-500/25 px-4 py-3.5">
          <p className="text-sm font-medium text-emerald-300">Reset complete.</p>
          <p className="text-xs text-zinc-500">
            {cleared.length === 0
              ? 'There was nothing logged to delete.'
              : cleared.map(([table, n]) => `${table.replace(/_/g, ' ')}: ${n}`).join(' · ')}
          </p>
          <p className="text-xs text-zinc-500">
            Backup written to <code className="font-mono text-zinc-400">{reset.data.backup_path}</code>. Restoring it
            needs shell access to the Pi — see the README.
          </p>
          <button onClick={cancel} className="btn btn-ghost btn-sm">Done</button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="label">Danger zone</h2>
      <div className="card space-y-3 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-medium text-zinc-200">Reset all data</span>
            <span className="block text-xs text-zinc-500">
              Deletes every deen day, opportunity, touch, observation and sadaqah entry. Your PIN and the settings
              above are kept.
            </span>
          </span>
          {!confirming && (
            <button onClick={() => setConfirming(true)} className="btn btn-danger btn-sm">
              Reset…
            </button>
          )}
        </div>

        {confirming && (
          <div className="space-y-3 border-t border-line pt-3">
            <p className="text-xs text-zinc-500">
              A backup is written to <code className="font-mono">backups/</code> first, but undoing a reset needs
              shell access to the Pi. Type <span className="font-mono text-zinc-300">RESET</span> to confirm.
            </p>
            <input
              type="text"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              placeholder="RESET"
              className="input font-mono"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
            {reset.isError && (
              <p className="text-xs text-red-400">
                {(reset.error as any)?.body?.error ?? 'Reset failed. Nothing was deleted.'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => reset.mutate()}
                disabled={!armed || reset.isPending}
                className="btn btn-danger btn-sm"
              >
                {reset.isPending ? 'Resetting…' : 'Delete everything'}
              </button>
              <button onClick={cancel} disabled={reset.isPending} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 px-4 py-4 sm:grid-cols-[1fr_260px] sm:items-center sm:gap-6">
      <div>
        <p className="text-sm font-medium text-zinc-200">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-zinc-600">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
