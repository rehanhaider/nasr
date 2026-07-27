import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { loginRequestSchema } from '@mizan/shared'
import { useAuthStatus } from '../data/queries.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../data/api.js'
import { queryKeys } from '../data/query-keys.js'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: (pin: string) => apiPost<{ token: string }>('/auth/login', { pin }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.status })
      navigate({ to: '/' })
    },
    onError: (err: any) => {
      setError(err?.body?.error ?? 'Login failed')
    },
  })

  const form = useForm({
    defaultValues: { pin: '' },
    validators: { onChange: loginRequestSchema },
    onSubmit: async ({ value }) => {
      setError(null)
      loginMutation.mutate(value.pin)
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Mizan</h1>
        <p className="mb-6 text-center text-sm text-gray-500">Enter your PIN to continue</p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field
            name="pin"
            children={(field) => (
              <div>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="PIN"
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-2xl tracking-[0.5em] outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-sm text-red-500">{field.state.meta.errors.join(', ')}</p>
                )}
              </div>
            )}
          />

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-xl bg-primary-600 py-3 font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
