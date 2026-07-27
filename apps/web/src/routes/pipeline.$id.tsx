import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useOpportunity } from '../data/queries.js'
import { useUpdateOpportunity, useDeleteOpportunity, useCreateTouch } from '../data/mutations.js'
import { useForm } from '@tanstack/react-form'
import { touchCreateSchema, getToday } from '@mizan/shared'
import type { OpportunityStatus, TouchChannel, TouchDirection } from '@mizan/shared'
import { useSettings } from '../data/queries.js'
import { useState } from 'react'

export const Route = createFileRoute('/pipeline/$id')({
  component: OpportunityDetailPage,
})

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

  const opp = oppQuery.data
  if (oppQuery.isLoading) return <div className="py-20 text-center text-gray-400">Loading...</div>
  if (!opp) return <div className="py-20 text-center text-gray-400">Not found</div>

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

  function handleStatusChange(newStatus: OpportunityStatus) {
    setStatusError(null)
    updateOpp.mutate(
      { id, status: newStatus },
      { onError: (err: any) => setStatusError(err?.body?.error ?? 'Failed to update status') },
    )
  }

  const ghostedDisabled = !opp.ghostedEligibility?.eligible
  const staleClass = opp.staleness === 'red' ? 'border-red-500' : opp.staleness === 'amber' ? 'border-amber-500' : 'border-transparent'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/pipeline" className="text-sm text-primary-600 hover:underline">← Back</Link>
          <h1 className="mt-1 text-2xl font-bold">{opp.name}</h1>
          {opp.organisation && <p className="text-gray-500">{opp.organisation}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => { deleteOpp.mutate(id, { onSuccess: () => navigate({ to: '/pipeline' }) }) }} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200">
            Delete
          </button>
        </div>
      </div>

      {opp.missingNextAction && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Missing next action — set one to clear this flag.
        </div>
      )}

      {statusError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{statusError}</div>
      )}

      <div className={`rounded-xl border-2 bg-white p-5 shadow-sm ${staleClass}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type" value={opp.type} />
          <Field label="Stage" value={opp.stage} />
          <Field label="Status" value={opp.status} />
          <Field label="Source" value={opp.source ?? '—'} />
          <Field label="Contact" value={opp.contact_name ?? '—'} />
          <Field label="Channel" value={opp.contact_channel ?? '—'} />
          <Field label="Opened" value={opp.opened_date} />
          <Field label="Next Action" value={opp.next_action ?? '—'} />
          <Field label="Next Action Date" value={opp.next_action_date ?? '—'} />
          <Field label="Written Outbounds" value={String(opp.writtenOutboundCount)} />
        </div>
        {opp.notes && <p className="mt-4 whitespace-pre-wrap text-sm text-gray-600">{opp.notes}</p>}

        {/* Quick status buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {opp.status === 'open' && (
            <>
              <button onClick={() => handleStatusChange('won')} className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800 hover:bg-green-200">Mark Won</button>
              <button onClick={() => handleStatusChange('lost')} className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-200">Mark Lost</button>
              <button onClick={() => handleStatusChange('withdrawn')} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200">Withdrawn</button>
              <button
                onClick={() => handleStatusChange('ghosted')}
                disabled={ghostedDisabled}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                title={ghostedDisabled ? opp.ghostedEligibility?.reason ?? '' : 'Mark as ghosted'}
              >
                Ghosted
              </button>
              {ghostedDisabled && opp.ghostedEligibility?.reason && (
                <span className="self-center text-xs text-gray-400">{opp.ghostedEligibility.reason}</span>
              )}
            </>
          )}
          {opp.status !== 'open' && (
            <button onClick={() => handleStatusChange('open')} className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-200">Reopen</button>
          )}
        </div>
      </div>

      {/* Touch log */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Touch Log</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            touchForm.handleSubmit()
          }}
          className="mb-4 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2"
        >
          <touchForm.Field name="date" children={(f) => (
            <input type="date" className="rounded-lg border px-3 py-2 text-sm" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />
          )} />
          <touchForm.Field name="direction" children={(f) => (
            <select className="rounded-lg border px-3 py-2 text-sm" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as TouchDirection)}>
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          )} />
          <touchForm.Field name="channel" children={(f) => (
            <select className="rounded-lg border px-3 py-2 text-sm" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as TouchChannel)}>
              {['email', 'linkedin', 'call', 'whatsapp', 'in_person', 'other'].map((c) => (
                <option key={c} value={c}>{c.replace('_', ' ')}</option>
              ))}
            </select>
          )} />
          <touchForm.Field name="written" children={(f) => (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.state.value} onChange={(e) => f.handleChange(e.target.checked)} className="rounded" />
              Written communication
            </label>
          )} />
          <touchForm.Field name="note" children={(f) => (
            <input type="text" placeholder="Note (optional)" className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} />
          )} />
          <button type="submit" disabled={createTouch.isPending} className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 sm:col-span-2">
            Add Touch
          </button>
        </form>

        <div className="space-y-2">
          {opp.touches?.map((t) => (
            <div key={t.id} className="flex items-start gap-3 rounded-lg bg-white px-4 py-3 shadow-sm">
              <div className={`mt-0.5 h-2 w-2 rounded-full ${t.direction === 'outbound' ? 'bg-primary-500' : 'bg-green-500'}`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium capitalize">{t.direction}</span>
                  <span className="text-gray-400">·</span>
                  <span className="capitalize text-gray-500">{t.channel.replace('_', ' ')}</span>
                  {t.written && <span className="rounded bg-primary-50 px-1.5 text-xs text-primary-600">written</span>}
                </div>
                <p className="text-xs text-gray-400">{t.date}</p>
                {t.note && <p className="mt-1 text-sm text-gray-600">{t.note}</p>}
              </div>
            </div>
          ))}
          {(!opp.touches || opp.touches.length === 0) && (
            <p className="py-4 text-center text-sm text-gray-400">No touches recorded</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm font-medium capitalize">{value}</dd>
    </div>
  )
}
