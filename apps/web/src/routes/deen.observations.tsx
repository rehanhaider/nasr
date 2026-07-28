import { createFileRoute } from '@tanstack/react-router'
import { useObservations } from '../data/queries.js'
import { useCreateObservation, useDeleteObservation } from '../data/mutations.js'
import { useForm } from '@tanstack/react-form'
import { observationCreateSchema } from '@nasr/shared'

export const Route = createFileRoute('/deen/observations')({
  component: ObservationsPage,
})

function ObservationsPage() {
  const obsQuery = useObservations()
  const createObs = useCreateObservation()
  const deleteObs = useDeleteObservation()

  const form = useForm({
    defaultValues: { text: '' },
    validators: { onChange: observationCreateSchema },
    onSubmit: async ({ value }) => {
      createObs.mutate(value)
      form.reset()
    },
  })

  const observations = obsQuery.data ?? []

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <p className="mt-1 text-sm text-zinc-500">Observations, worth keeping around.</p>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="card space-y-3 p-4"
      >
        <form.Field
          name="text"
          children={(field) => (
            <textarea
              rows={3}
              placeholder="Write an observation…"
              className="input resize-none border-0 bg-transparent p-0 text-sm focus:ring-0 focus:shadow-none"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        />
        <div className="flex justify-end border-t border-line pt-3">
          <button type="submit" disabled={createObs.isPending} className="btn btn-primary btn-sm">
            {createObs.isPending ? 'Saving…' : 'Add note'}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {observations.map((obs) => (
          <article
            key={obs.id}
            className="card group px-4 py-3.5 transition hover:border-line-strong"
          >
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <time className="font-mono text-[11px] text-zinc-600">
                {new Date(obs.timestamp).toLocaleString()}
              </time>
              <button
                onClick={() => deleteObs.mutate(obs.id)}
                className="text-[11px] text-zinc-700 opacity-0 transition hover:text-red-400 focus-visible:opacity-100 group-hover:opacity-100"
              >
                Delete
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">{obs.text}</p>
          </article>
        ))}

        {observations.length === 0 && !obsQuery.isLoading && (
          <div className="rounded-xl border border-dashed border-line py-16 text-center">
            <p className="text-sm text-zinc-600">No notes yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
