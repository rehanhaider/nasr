import { createFileRoute } from '@tanstack/react-router'
import { useSettings } from '../data/queries.js'
import { useUpdateSettings, useLogout } from '../data/mutations.js'
import { useForm } from '@tanstack/react-form'
import { settingsUpdateSchema } from '@mizan/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../data/api.js'
import { queryKeys } from '../data/query-keys.js'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const settingsQuery = useSettings()
  const updateSettings = useUpdateSettings()
  const qc = useQueryClient()

  const logoutMutation = useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>('/auth/logout', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.status })
      window.location.href = '/login'
    },
  })

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
    return <div className="py-20 text-center text-gray-400">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
          <form.Field
            name="timezone"
            children={(field) => (
              <input
                type="text"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
          <p className="mt-1 text-xs text-gray-400">e.g. Asia/Kolkata, America/New_York</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">40-Day Cycle Start</label>
          <form.Field
            name="cycle_start_date"
            children={(field) => (
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">90-Day Pipeline Start</label>
          <form.Field
            name="pipeline_start_date"
            children={(field) => (
              <input
                type="date"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Istighfar Daily Target</label>
          <form.Field
            name="istighfar_target"
            children={(field) => (
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Open Conversations Target</label>
          <form.Field
            name="live_target"
            children={(field) => (
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-primary-500"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            )}
          />
        </div>

        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="rounded-xl bg-primary-600 px-6 py-2.5 font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </button>

        {updateSettings.isSuccess && (
          <p className="text-sm text-green-600">Settings saved.</p>
        )}
      </form>

      <hr className="border-gray-200" />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Account</h2>
        <button
          onClick={() => logoutMutation.mutate()}
          className="rounded-xl bg-red-100 px-6 py-2.5 font-semibold text-red-700 hover:bg-red-200"
        >
          Log Out
        </button>
      </div>
    </div>
  )
}
