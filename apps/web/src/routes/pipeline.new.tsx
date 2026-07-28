import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { opportunityCreateSchema, getToday } from '@nasr/shared'
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
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-4">
        <Link to="/pipeline" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition hover:text-zinc-200">
          <span aria-hidden>←</span> Pipeline
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">New opportunity</h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <fieldset className="card space-y-4 p-5">
          <legend className="label px-1">Who</legend>
          <FormField form={form} name="name" label="Name" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField form={form} name="organisation" label="Organisation" />
            <FormField form={form} name="contact_name" label="Contact name" />
            <FormField form={form} name="contact_channel" label="Contact channel" />
            <FormField form={form} name="source" label="Source" />
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="label px-1">Classification</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              form={form}
              name="type"
              label="Type"
              options={['job', 'client', 'training', 'funding', 'other']}
            />
            <SelectField
              form={form}
              name="stage"
              label="Stage"
              options={['lead', 'conversation', 'proposal', 'commitment']}
            />
            <FormField form={form} name="opened_date" label="Opened date" type="date" required />
          </div>
        </fieldset>

        <fieldset className="card space-y-4 p-5">
          <legend className="label px-1">Next step</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField form={form} name="next_action" label="Next action" />
            <FormField form={form} name="next_action_date" label="Next action date" type="date" />
          </div>
          <div>
            <label className="label mb-1.5 block">Notes</label>
            <form.Field
              name="notes"
              children={(field) => (
                <textarea
                  rows={3}
                  className="input resize-none"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              )}
            />
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button type="submit" disabled={create.isPending} className="btn btn-primary">
            {create.isPending ? 'Creating…' : 'Create opportunity'}
          </button>
          <button type="button" onClick={() => navigate({ to: '/pipeline' })} className="btn btn-ghost">
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
      <label className="label mb-1.5 block">
        {label}
        {required && <span className="ml-0.5 text-primary-400">*</span>}
      </label>
      <form.Field
        name={name}
        children={(field: any) => (
          <>
            <input
              type={type}
              className="input"
              value={field.state.value}
              onChange={(e: any) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p className="mt-1.5 text-xs text-red-400">{field.state.meta.errors.join(', ')}</p>
            )}
          </>
        )}
      />
    </div>
  )
}

function SelectField({ form, name, label, options }: { form: any; name: string; label: string; options: string[] }) {
  return (
    <div>
      <label className="label mb-1.5 block">{label}</label>
      <form.Field
        name={name}
        children={(field: any) => (
          <select
            className="input capitalize"
            value={field.state.value}
            onChange={(e: any) => field.handleChange(e.target.value)}
          >
            {options.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        )}
      />
    </div>
  )
}
