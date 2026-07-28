import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  DeenDay,
  DeenDayUpdate,
  ObservationCreate,
  Opportunity,
  OpportunityCreate,
  OpportunityUpdate,
  SadaqahCreate,
  Settings,
  SettingsUpdate,
  Touch,
  TouchCreate,
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

export function useCreateSadaqah() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: SadaqahCreate) => apiPost('/deen/sadaqah', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deen.sadaqah })
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

export function useCreateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OpportunityCreate) =>
      apiPost<Opportunity>('/pipeline/opportunities', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.opportunities })
    },
  })
}

export function useUpdateOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OpportunityUpdate) =>
      apiPut<Opportunity>(`/pipeline/opportunity/${encodeURIComponent(data.id)}`, data),
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.opportunity(variables.id) })
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.opportunities })
    },
  })
}

export function useDeleteOpportunity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: boolean }>(`/pipeline/opportunity/${encodeURIComponent(id)}`),
    onSuccess: (_result, id) => {
      qc.removeQueries({ queryKey: queryKeys.pipeline.opportunity(id) })
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.opportunities })
    },
  })
}

export function useCreateTouch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: TouchCreate) => apiPost<Touch>('/pipeline/touches', data),
    onSuccess: (_result, variables) => {
      // A touch changes the parent's staleness, last touch and written count.
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.opportunity(variables.opportunity_id) })
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.touches(variables.opportunity_id) })
      qc.invalidateQueries({ queryKey: queryKeys.pipeline.opportunities })
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

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => apiPost<{ ok: boolean }>('/auth/logout', {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.status })
    },
  })
}
