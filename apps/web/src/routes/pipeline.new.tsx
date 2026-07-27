import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { opportunityCreateSchema, getToday } from '@mizan/shared'
import { useCreateOpportunity } from '../data/mutations.js'
import { useSettings } from '../data/queries.js'

export const Route = createFileRoute('/pipeline/new')({
  component: NewOpportunityPage,
})

function NewOpportunityPage() {
  const navigate = useNavigate()
  const create = useCreateOpportunity()
  const settingsQuery = useSettings()
  const timezone = settingsQuery.data?.timezone ?? 'Asia/Kolkata'
  const today = getToday(timezone)

  const form = useForm({
    defaultValues: {
      name: '',
      organisation: '',
      contact_name: '',
      contact_channel: '',
      type: 'job' as const,
      source: '',
      stage: 'lead' as const,
      status: 'open' as const,
      opened_date: today,
      next_action: '',
      next_action_date: '',
      notes: '',
    },
    validators: { onChange: opportunityCreateSchema },
    onSubmit: async ({ value }) => {
      const data = {
        ...value,
        organisation: value.organisation || null,
        contact_name: value.contact_name || null,
        contact_channel: value.contact_channel || null,
        source: value.source || null,
        next_action: value.next_action || null,
        next_action_date: value.next_action_date || null,
        notes: value.notes || null,
      }
      create.mutate(data, {
        onSuccess: () => navigate({ to: '/pipeline' }),
      })
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">New Opportunity</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <FormField form={form} name="name" label="Name" required />
        <FormField form={form} name="organisation" label="Organisation" />
        <FormField form={form} name="contact_name" label="Contact Name" />
        <FormField form={form} name="contact_channel" label="Contact Channel" />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
          <form.Field
            name="type"
            children={(field) => (
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as any)}
              >
                {['job', 'client', 'training', 'funding', 'other'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          />
        </div>

        <FormField form={form} name="source" label="Source" />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Stage</label>
          <form.Field
            name="stage"
            children={(field) => (
              <select
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value as any)}
              >
                {['lead', 'conversation', 'proposal', 'commitment'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          />
        </div>

        <FormField form={form} name="opened_date" label="Opened Date" type="date" required />
        <FormField form={form} name="next_action" label="Next Action" />
        <FormField form={form} name="next_action_date" label="Next Action Date" type="date" />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
          <form.Field
            name="notes"
            children={(field) => (
              <textarea
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={create.isPending} className="rounded-xl bg-primary-600 px-6 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-50">
            Create
          </button>
          <button type="button" onClick={() => navigate({ to: '/pipeline' })} className="rounded-xl bg-gray-200 px-6 py-2.5 font-semibold text-gray-600">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function FormField({ form, name, label, type = 'text', required }: { form: any; name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400">*</span>}
      </label>
      <form.Field
        name={name}
        children={(field: any) => (
          <>
            <input
              type={type}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              value={field.state.value}
              onChange={(e: any) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
            )}
          </>
        )}
      />
    </div>
  )
}
