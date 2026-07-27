import { createFileRoute } from '@tanstack/react-router'
import { useObservations } from '../data/queries.js'
import { useCreateObservation, useDeleteObservation } from '../data/mutations.js'
import { useForm } from '@tanstack/react-form'
import { observationCreateSchema } from '@mizan/shared'

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Observations</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-3"
      >
        <form.Field
          name="text"
          children={(field) => (
            <textarea
              rows={3}
              placeholder="Write an observation..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        />
        <button
          type="submit"
          disabled={createObs.isPending}
          className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          Add Observation
        </button>
      </form>

      <div className="space-y-3">
        {obsQuery.data?.map((obs) => (
          <div key={obs.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="mb-1 flex items-start justify-between">
              <time className="text-xs text-gray-400">
                {new Date(obs.timestamp).toLocaleString()}
              </time>
              <button
                onClick={() => deleteObs.mutate(obs.id)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{obs.text}</p>
          </div>
        ))}

        {obsQuery.data?.length === 0 && (
          <p className="py-12 text-center text-gray-400">No observations yet</p>
        )}
      </div>
    </div>
  )
}
