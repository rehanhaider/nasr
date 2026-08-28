import { useQuery } from '@tanstack/react-query'
import type { DeenContent, DeenDay, Settings } from '@nasr/shared'
import { apiGet } from './api.js'
import { queryKeys } from './query-keys.js'

export interface AuthStatus {
  authenticated: boolean
  pinSet: boolean
}

export interface DeenDaysResponse {
  days: DeenDay[]
  cycleDay: number | null
  today: string
}

export interface ObservationRecord {
  id: string
  timestamp: string
  text: string
}

export function useAuthStatus() {
  return useQuery({
    queryKey: queryKeys.auth.status,
    queryFn: () => apiGet<AuthStatus>('/auth/status'),
    // The 401-vs-200 answer is the point of this query; never serve it stale.
    staleTime: 0,
    retry: false,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiGet<Settings>('/settings'),
  })
}

export function useDeenDays() {
  return useQuery({
    queryKey: queryKeys.deen.days,
    queryFn: () => apiGet<DeenDaysResponse>('/deen/days'),
  })
}

export function useDeenDay(date: string) {
  return useQuery({
    queryKey: queryKeys.deen.day(date),
    queryFn: () => apiGet<DeenDay>(`/deen/day/${encodeURIComponent(date)}`),
    enabled: !!date,
  })
}

export function useDeenContent() {
  return useQuery({
    queryKey: queryKeys.deen.content,
    queryFn: () => apiGet<DeenContent[]>('/deen/content'),
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useObservations() {
  return useQuery({
    queryKey: queryKeys.deen.observations,
    queryFn: () => apiGet<ObservationRecord[]>('/deen/observations'),
  })
}
