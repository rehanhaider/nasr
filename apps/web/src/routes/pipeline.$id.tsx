import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useOpportunity, useSettings } from '../data/queries.js'
import { useUpdateOpportunity, useDeleteOpportunity, useCreateTouch } from '../data/mutations.js'
import { useForm } from '@tanstack/react-form'
import { touchCreateSchema, getToday } from '@nasr/shared'
import type { OpportunityStatus, TouchChannel, TouchDirection } from '@nasr/shared'
import { useState } from 'react'

export const Route = createFileRoute('/pipeline/$id')({
  component: OpportunityDetailPage,
})

const statusTone: Record<string, string> = {
  open: 'bg-primary-500/12 text-primary-300',
  won: 'bg-emerald-500/12 text-emerald-300',
  lost: 'bg-red-500/12 text-red-300',
  ghosted: 'bg-elevated text-zinc-400',
  withdrawn: 'bg-amber-500/12 text-amber-300',
}

function OpportunityDetailPage() {
  const { id } = Route.useParams()
  const oppQuery = useOpportunity(id)
  const settingsQuery = useSettings()
  const updateOpp = useUpdateOpportunity()
  const deleteOpp = useDeleteOpportunity()
  const createTouch = useCreateTouch()
  const navigate = useNavigate()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Declared before any early return: bailing out above a hook changes the hook
  // count between renders and React throws once the query resolves.
  const touchForm = useForm({
    defaultValues: {
      opportunity_id: id,
      date: today,
      direction: 'outbound' as TouchDirection,
      channel: 'email' as TouchChannel,
      written: true,
      note: '',
    },
    validators: { onChange: touchCreateSchema },
    onSubmit: async ({ value }) => {
      createTouch.mutate({ ...value, note: value.note || null })
      touchForm.reset()
    },
  })

  const opp = oppQuery.data
  if (oppQuery.isLoading) return <p className="py-24 text-center text-sm text-zinc-600">Loading…</p>
  if (!opp) return <p className="py-24 text-center text-sm text-zinc-600">Not found.</p>

  function handleStatusChange(newStatus: OpportunityStatus) {
    setStatusError(null)
    updateOpp.mutate(
      { id, status: newStatus },
      { onError: (err: any) => setStatusError(err?.body?.error ?? 'Failed to update status') },
    )
  }

  const ghostedDisabled = !opp.ghostedEligibility?.eligible
  const staleRing =
    opp.staleness === 'red'
      ? 'border-red-500/40'
      : opp.staleness === 'amber'
        ? 'border-amber-500/40'
        : 'border-line'

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link to="/pipeline" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-200">
          <span aria-hidden>←</span> Pipeline
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{opp.name}</h1>
              <span className={`chip ${statusTone[opp.status] ?? 'bg-elevated text-zinc-400'}`}>
                {opp.status}
              </span>
            </div>
            {opp.organisation && <p className="mt-1 text-sm text-zinc-500">{opp.organisation}</p>}
          </div>
          <button
            onClick={() => deleteOpp.mutate(id, { onSuccess: () => navigate({ to: '/pipeline' }) })}
            className="btn btn-danger btn-sm"
          >
            Delete
          </button>
        </div>
      </header>

      {opp.missingNextAction && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-200">
          No next action set.
        </div>
      )}

      {statusError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {statusError}
        </div>
      )}

      {/* Detail */}
      <div className={`card border ${staleRing}`}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 sm:grid-cols-3">
          <Field label="Type" value={opp.type} caps />
          <Field label="Stage" value={opp.stage} caps />
          <Field label="Source" value={opp.source ?? '—'} />
          <Field label="Contact" value={opp.contact_name ?? '—'} />
          <Field label="Channel" value={opp.contact_channel ?? '—'} />
          <Field label="Opened" value={opp.opened_date} mono />
          <Field label="Next action" value={opp.next_action ?? '—'} />
          <Field label="Next action date" value={opp.next_action_date ?? '—'} mono />
          <Field label="Written outbounds" value={String(opp.writtenOutboundCount)} mono />
        </dl>

        {opp.notes && (
          <div className="border-t border-line px-5 py-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{opp.notes}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4">
          {opp.status === 'open' ? (
            <>
              <button onClick={() => handleStatusChange('won')} className="btn btn-secondary btn-sm">Mark won</button>
              <button onClick={() => handleStatusChange('lost')} className="btn btn-secondary btn-sm">Mark lost</button>
              <button onClick={() => handleStatusChange('withdrawn')} className="btn btn-secondary btn-sm">Withdrawn</button>
              <button
                onClick={() => handleStatusChange('ghosted')}
                disabled={ghostedDisabled}
                title={ghostedDisabled ? opp.ghostedEligibility?.reason ?? '' : 'Mark as ghosted'}
                className="btn btn-secondary btn-sm"
              >
                Ghosted
              </button>
              {ghostedDisabled && opp.ghostedEligibility?.reason && (
                <span className="text-xs text-zinc-600">{opp.ghostedEligibility.reason}</span>
              )}
            </>
          ) : (
            <button onClick={() => handleStatusChange('open')} className="btn btn-secondary btn-sm">Reopen</button>
          )}
        </div>
      </div>

      {/* Touch log */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="label">Touch log</h2>
          <span className="font-mono text-xs text-zinc-600">
            {opp.lastTouchDate ? `last ${opp.lastTouchDate}` : 'no touches'}
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            touchForm.handleSubmit()
          }}
          className="card grid gap-3 p-4 sm:grid-cols-2"
        >
          <touchForm.Field name="date" children={(f) => (
            <input type="date" className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />
          )} />
          <touchForm.Field name="direction" children={(f) => (
            <select className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as TouchDirection)}>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          )} />
          <touchForm.Field name="channel" children={(f) => (
            <select className="input" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as TouchChannel)}>
              {['email', 'linkedin', 'call', 'whatsapp', 'in_person', 'other'].map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          )} />
          <touchForm.Field name="written" children={(f) => (
            <label className="flex cursor-pointer items-center gap-2.5 px-1 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={f.state.value}
                onChange={(e) => f.handleChange(e.target.checked)}
                className="h-4 w-4 rounded border-line-strong bg-elevated accent-primary-500"
              />
              Written communication
            </label>
          )} />
          <touchForm.Field name="note" children={(f) => (
            <input
              type="text"
              placeholder="Note (optional)"
              className="input sm:col-span-2"
              value={f.state.value}
              onChange={(e) => f.handleChange(e.target.value)}
            />
          )} />
          <div className="sm:col-span-2">
            <button type="submit" disabled={createTouch.isPending} className="btn btn-primary btn-sm">
              {createTouch.isPending ? 'Adding…' : 'Add touch'}
            </button>
          </div>
        </form>

        <div className="space-y-1.5">
          {opp.touches?.map((t) => (
            <div key={t.id} className="card flex items-start gap-3 px-4 py-3">
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  t.direction === 'outbound' ? 'bg-primary-400' : 'bg-emerald-400'
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                  <span className="font-medium capitalize text-zinc-200">{t.direction}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="capitalize text-zinc-500">{t.channel.replace('_', ' ')}</span>
                  {t.written && (
                    <span className="chip bg-primary-500/10 text-primary-300/80">written</span>
                  )}
                  <span className="ml-auto font-mono text-[11px] text-zinc-600">{t.date}</span>
                </div>
                {t.note && <p className="mt-1 text-sm text-zinc-400">{t.note}</p>}
              </div>
            </div>
          ))}
          {(!opp.touches || opp.touches.length === 0) && (
            <div className="rounded-xl border border-dashed border-line py-12 text-center">
              <p className="text-sm text-zinc-600">No touches recorded.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

// `caps` is only for enum values (type, stage). Free text — contact names,
// next actions — must render exactly as the user typed it.
function Field({ label, value, mono, caps }: { label: string; value: string; mono?: boolean; caps?: boolean }) {
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className={`mt-1.5 text-sm text-zinc-200 ${mono ? 'font-mono text-xs' : ''} ${caps ? 'capitalize' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
