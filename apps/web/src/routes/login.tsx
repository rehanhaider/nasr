import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { loginRequestSchema } from '@nasr/shared'
import { useAuthStatus } from '../data/queries.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost } from '../data/api.js'
import { queryKeys } from '../data/query-keys.js'
import { fieldErrorText } from '../lib/form.js'
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      {/* Ambient accent behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[100px]"
        style={{ background: 'radial-gradient(circle, var(--color-primary-700) 0%, transparent 68%)' }}
      />

      <div className="relative w-full max-w-[340px]">
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary-500 shadow-[0_0_14px_var(--color-primary-500)]" />
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">nasr</h1>
            <p className="mt-1 text-sm text-zinc-500">Enter your PIN to continue</p>
          </div>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
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
                    placeholder="••••"
                    autoFocus
                    autoComplete="current-password"
                    className="input py-3 text-center font-mono text-xl tracking-[0.6em] placeholder:tracking-[0.4em]"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                  />
                  {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                    <p className="mt-2 text-xs text-red-400">{fieldErrorText(field.state.meta.errors)}</p>
                  )}
                </div>
              )}
            />

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="btn btn-primary w-full py-2.5"
            >
              {loginMutation.isPending ? 'Verifying…' : 'Unlock'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-700">
          Locks for 10 minutes after 5 failed attempts.
        </p>
      </div>
    </div>
  )
}
