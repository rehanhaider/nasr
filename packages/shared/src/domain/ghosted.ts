import type { Touch } from '../schemas/pipeline.js'

export interface GhostedEligibility {
  eligible: boolean
  reason: string | null
  writtenOutboundCount: number
  daysSinceLastOutbound: number | null
}

/**
 * Determine if an opportunity can be marked as "ghosted".
 *
 * Requirements:
 * 1. At least 2 written outbound touches
 * 2. At least 14 days since the last outbound touch
 *
 * Both conditions must be met. This is the canonical check,
 * enforced server-side — the UI merely reflects it.
 */
export function checkGhostedEligibility(
  touches: Pick<Touch, 'direction' | 'written' | 'date'>[],
  today: string,
): GhostedEligibility {
  const writtenOutbound = touches.filter(
    (t) => t.direction === 'outbound' && t.written,
  )

  const writtenOutboundCount = writtenOutbound.length

  if (writtenOutboundCount < 2) {
    return {
      eligible: false,
      reason: `Need at least 2 written outbound touches (have ${writtenOutboundCount})`,
      writtenOutboundCount,
      daysSinceLastOutbound: null,
    }
  }

  const outboundTouches = touches.filter((t) => t.direction === 'outbound')
  const lastOutbound = outboundTouches
    .map((t) => t.date)
    .sort()
    .reverse()[0]

  if (!lastOutbound) {
    return {
      eligible: false,
      reason: 'No outbound touches found',
      writtenOutboundCount,
      daysSinceLastOutbound: null,
    }
  }

  const daysSince = dayDiff(lastOutbound, today)

  if (daysSince < 14) {
    return {
      eligible: false,
      reason: `Need 14+ days since last outbound (only ${daysSince} days)`,
      writtenOutboundCount,
      daysSinceLastOutbound: daysSince,
    }
  }

  return {
    eligible: true,
    reason: null,
    writtenOutboundCount,
    daysSinceLastOutbound: daysSince,
  }
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z')
  const db = new Date(b + 'T00:00:00Z')
  return Math.round((db.getTime() - da.getTime()) / 86_400_000)
}

/**
 * Staleness level for an opportunity based on last touch date.
 * - amber: 7-13 days
 * - red: 14+ days
 * - null: fresh (< 7 days)
 */
export function stalenessLevel(
  lastTouchDate: string | null,
  today: string,
): 'amber' | 'red' | null {
  if (!lastTouchDate) return 'red'
  const days = dayDiff(lastTouchDate, today)
  if (days >= 14) return 'red'
  if (days >= 7) return 'amber'
  return null
}

/**
 * Check if an open opportunity is missing required next-action fields.
 */
export function isMissingNextAction(opp: {
  status: string
  next_action: string | null
  next_action_date: string | null
}): boolean {
  if (opp.status !== 'open') return false
  return !opp.next_action || !opp.next_action_date
}
