import { useQuery } from '@tanstack/react-query'
import type { DeenDay, GhostedEligibility, Opportunity, Settings, Touch } from '@nasr/shared'
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

/** GET /pipeline/opportunities — the list endpoint enriches each row. */
export interface OpportunityWithMeta extends Opportunity {
  last_touch_date: string | null
  written_outbound_count: number
}

/** GET /pipeline/opportunity/$id — single opportunity plus derived fields. */
export interface OpportunityDetail extends Opportunity {
  touches: Touch[]
  lastTouchDate: string | null
  writtenOutboundCount: number
  ghostedEligibility: GhostedEligibility
  staleness: 'amber' | 'red' | null
  missingNextAction: boolean
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

export function useObservations() {
  return useQuery({
    queryKey: queryKeys.deen.observations,
    queryFn: () => apiGet<ObservationRecord[]>('/deen/observations'),
  })
}

export function useOpportunities() {
  return useQuery({
    queryKey: queryKeys.pipeline.opportunities,
    queryFn: () => apiGet<OpportunityWithMeta[]>('/pipeline/opportunities'),
  })
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: queryKeys.pipeline.opportunity(id),
    queryFn: () => apiGet<OpportunityDetail>(`/pipeline/opportunity/${encodeURIComponent(id)}`),
    enabled: !!id,
  })
}

export function useTouches(opportunityId: string) {
  return useQuery({
    queryKey: queryKeys.pipeline.touches(opportunityId),
    queryFn: () =>
      apiGet<Touch[]>(`/pipeline/touches?opportunity_id=${encodeURIComponent(opportunityId)}`),
    enabled: !!opportunityId,
  })
}
