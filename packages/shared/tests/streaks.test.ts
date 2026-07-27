import { describe, it, expect } from 'vitest'
import { computeStreak, fajrOnTimeStreak } from '../src/domain/streaks.js'
import type { DeenDay } from '../src/schemas/deen.js'

function makeDay(date: string, fajr: 'ontime' | 'qada' | 'missed' | null = null): DeenDay {
  return {
    date,
    fajr,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
    morning_adhkar: false,
    evening_adhkar: false,
    night_ayat: false,
    ruqyah: false,
    istighfar_count: 0,
    note: null,
  }
}

describe('computeStreak', () => {
  it('returns 0/0 for empty days', () => {
    const result = computeStreak([], () => true, '2025-01-10')
    expect(result).toEqual({ current: 0, longest: 0 })
  })

  it('computes current streak ending today', () => {
    const days = [
      makeDay('2025-01-08'),
      makeDay('2025-01-09'),
      makeDay('2025-01-10'),
    ]
    const result = computeStreak(days, () => true, '2025-01-10')
    expect(result.current).toBe(3)
    expect(result.longest).toBe(3)
  })

  it('current streak includes yesterday but not today yet', () => {
    const days = [
      makeDay('2025-01-08'),
      makeDay('2025-01-09'),
    ]
    const result = computeStreak(days, () => true, '2025-01-10')
    expect(result.current).toBe(2)
  })

  it('current streak is 0 when last match is older than yesterday', () => {
    const days = [
      makeDay('2025-01-06'),
      makeDay('2025-01-07'),
    ]
    const result = computeStreak(days, () => true, '2025-01-10')
    expect(result.current).toBe(0)
    expect(result.longest).toBe(2)
  })

  it('handles gaps in streak', () => {
    const days = [
      makeDay('2025-01-01'),
      makeDay('2025-01-02'),
      makeDay('2025-01-04'),
      makeDay('2025-01-05'),
      makeDay('2025-01-06'),
    ]
    const result = computeStreak(days, () => true, '2025-01-06')
    expect(result.current).toBe(3)
    expect(result.longest).toBe(3)
  })

  it('filters with predicate', () => {
    const days = [
      makeDay('2025-01-08', 'ontime'),
      makeDay('2025-01-09', 'missed'),
      makeDay('2025-01-10', 'ontime'),
    ]
    const result = computeStreak(
      days,
      (d) => (d as DeenDay).fajr === 'ontime',
      '2025-01-10',
    )
    expect(result.current).toBe(1)
    expect(result.longest).toBe(1)
  })
})

describe('fajrOnTimeStreak', () => {
  it('tracks on-time fajr specifically', () => {
    const days = [
      makeDay('2025-01-07', 'ontime'),
      makeDay('2025-01-08', 'ontime'),
      makeDay('2025-01-09', 'qada'),
      makeDay('2025-01-10', 'ontime'),
    ]
    const result = fajrOnTimeStreak(days, '2025-01-10')
    expect(result.current).toBe(1)
    expect(result.longest).toBe(2)
  })

  it('qada does not count for on-time streak', () => {
    const days = [
      makeDay('2025-01-09', 'qada'),
      makeDay('2025-01-10', 'qada'),
    ]
    const result = fajrOnTimeStreak(days, '2025-01-10')
    expect(result.current).toBe(0)
  })
})
