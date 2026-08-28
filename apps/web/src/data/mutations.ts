import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DeenDay,
  DeenDayUpdate,
  ObservationCreate,
  ResetResponse,
  Settings,
  SettingsUpdate,
} from '@nasr/shared'
import { apiDelete, apiPost, apiPut } from './api.js'
import { queryKeys } from './query-keys.js'
import type { ObservationRecord } from './queries.js'

export function useUpdateDeenDay() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DeenDayUpdate) =>
      apiPut<DeenDay>(`/deen/day/${encodeURIComponent(data.date)}`, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.deen.day(variables.date) })
      qc.invalidateQueries({ queryKey: queryKeys.deen.days })
    },
  })
}

export function useCreateObservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ObservationCreate) => apiPost<ObservationRecord>('/deen/observations', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deen.observations })
    },
  })
}

export function useDeleteObservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: boolean }>(`/deen/observations?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deen.observations })
    },
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SettingsUpdate) => apiPut<Settings>('/settings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.settings })
      // The cycle window is derived from cycle_start_date/timezone.
      qc.invalidateQueries({ queryKey: queryKeys.deen.days })
    },
  })
}

export function useResetData() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<ResetResponse>('/settings/reset', { confirm: 'RESET' }),
    onSuccess: () => {
      // Every list the app renders came out of the tables that were just
      // cleared, so nothing cached survives this.
      qc.invalidateQueries()
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>('/auth/logout', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.status })
    },
  })
}
