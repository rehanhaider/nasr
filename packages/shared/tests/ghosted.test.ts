import { describe, it, expect } from 'vitest'
import {
  checkGhostedEligibility,
  stalenessLevel,
  isMissingNextAction,
} from '../src/domain/ghosted.js'
import type { Touch } from '../src/schemas/pipeline.js'

function makeTouch(overrides: Partial<Touch> & { date: string; direction: 'outbound' | 'inbound' }): Pick<Touch, 'direction' | 'written' | 'date'> {
  return {
    direction: overrides.direction,
    written: overrides.written ?? false,
    date: overrides.date,
  }
}

describe('checkGhostedEligibility', () => {
  it('requires at least 2 written outbound touches', () => {
    const touches = [
      makeTouch({ date: '2025-01-01', direction: 'outbound', written: true }),
    ]
    const result = checkGhostedEligibility(touches, '2025-02-01')
    expect(result.eligible).toBe(false)
    expect(result.writtenOutboundCount).toBe(1)
    expect(result.reason).toContain('2 written outbound')
  })

  it('non-written outbound does not count toward the 2-touch requirement', () => {
    const touches = [
      makeTouch({ date: '2025-01-01', direction: 'outbound', written: false }),
      makeTouch({ date: '2025-01-02', direction: 'outbound', written: false }),
    ]
    const result = checkGhostedEligibility(touches, '2025-02-01')
    expect(result.eligible).toBe(false)
    expect(result.writtenOutboundCount).toBe(0)
  })

  it('requires 14 days since last outbound touch', () => {
    const touches = [
      makeTouch({ date: '2025-01-01', direction: 'outbound', written: true }),
      makeTouch({ date: '2025-01-10', direction: 'outbound', written: true }),
    ]
    const result = checkGhostedEligibility(touches, '2025-01-20')
    expect(result.eligible).toBe(false)
    expect(result.daysSinceLastOutbound).toBe(10)
    expect(result.reason).toContain('14+ days')
  })

  it('is eligible with 2 written outbound touches and 14+ days', () => {
    const touches = [
      makeTouch({ date: '2025-01-01', direction: 'outbound', written: true }),
      makeTouch({ date: '2025-01-05', direction: 'outbound', written: true }),
    ]
    const result = checkGhostedEligibility(touches, '2025-01-20')
    expect(result.eligible).toBe(true)
    expect(result.reason).toBeNull()
    expect(result.writtenOutboundCount).toBe(2)
    expect(result.daysSinceLastOutbound).toBe(15)
  })

  it('inbound touches do not count', () => {
    const touches = [
      makeTouch({ date: '2025-01-01', direction: 'outbound', written: true }),
      makeTouch({ date: '2025-01-02', direction: 'inbound', written: true }),
    ]
    const result = checkGhostedEligibility(touches, '2025-02-01')
    expect(result.eligible).toBe(false)
    expect(result.writtenOutboundCount).toBe(1)
  })

  it('eligible at exactly 14 days', () => {
    const touches = [
      makeTouch({ date: '2025-01-01', direction: 'outbound', written: true }),
      makeTouch({ date: '2025-01-03', direction: 'outbound', written: true }),
    ]
    const result = checkGhostedEligibility(touches, '2025-01-17')
    expect(result.eligible).toBe(true)
    expect(result.daysSinceLastOutbound).toBe(14)
  })
})

describe('stalenessLevel', () => {
  it('returns null for fresh (<7 days)', () => {
    expect(stalenessLevel('2025-01-10', '2025-01-15')).toBeNull()
  })

  it('returns amber for 7-13 days', () => {
    expect(stalenessLevel('2025-01-01', '2025-01-08')).toBe('amber')
    expect(stalenessLevel('2025-01-01', '2025-01-13')).toBe('amber')
  })

  it('returns red for 14+ days', () => {
    expect(stalenessLevel('2025-01-01', '2025-01-15')).toBe('red')
  })

  it('returns red when no last touch date', () => {
    expect(stalenessLevel(null, '2025-01-10')).toBe('red')
  })
})

describe('isMissingNextAction', () => {
  it('returns true for open opportunity with no next action', () => {
    expect(
      isMissingNextAction({ status: 'open', next_action: null, next_action_date: null }),
    ).toBe(true)
  })

  it('returns true when next_action_date is missing', () => {
    expect(
      isMissingNextAction({ status: 'open', next_action: 'Follow up', next_action_date: null }),
    ).toBe(true)
  })

  it('returns false for open opportunity with both fields set', () => {
    expect(
      isMissingNextAction({
        status: 'open',
        next_action: 'Call them',
        next_action_date: '2025-02-01',
      }),
    ).toBe(false)
  })

  it('returns false for non-open opportunities', () => {
    expect(
      isMissingNextAction({ status: 'won', next_action: null, next_action_date: null }),
    ).toBe(false)
  })
})
