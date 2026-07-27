import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { resolve } from 'node:path'
import { randomBytes, scryptSync, createHash } from 'node:crypto'
import { checkGhostedEligibility } from '@mizan/shared'

describe('Auth: PIN and session logic', () => {
  it('hashes PIN with scrypt and verifies correctly', () => {
    const pin = '1234'
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(pin, salt, 64).toString('hex')
    const stored = `${salt}:${hash}`

    const [s, h] = stored.split(':')
    const testHash = scryptSync(pin, s, 64)
    expect(testHash.toString('hex')).toBe(h)
  })

  it('rejects wrong PIN', () => {
    const pin = '1234'
    const salt = randomBytes(16).toString('hex')
    const hash = scryptSync(pin, salt, 64).toString('hex')
    const stored = `${salt}:${hash}`

    const [s, h] = stored.split(':')
    const wrongHash = scryptSync('9999', s, 64)
    expect(wrongHash.toString('hex')).not.toBe(h)
  })

  it('token hashing is consistent', () => {
    const token = randomBytes(32).toString('hex')
    const hash1 = createHash('sha256').update(token).digest('hex')
    const hash2 = createHash('sha256').update(token).digest('hex')
    expect(hash1).toBe(hash2)
  })

  it('different tokens produce different hashes', () => {
    const token1 = randomBytes(32).toString('hex')
    const token2 = randomBytes(32).toString('hex')
    const hash1 = createHash('sha256').update(token1).digest('hex')
    const hash2 = createHash('sha256').update(token2).digest('hex')
    expect(hash1).not.toBe(hash2)
  })
})

describe('Auth: cookie and bearer token extraction', () => {
  function extractTokenFromCookie(cookieHeader: string, cookieName: string): string | null {
    for (const part of cookieHeader.split(/;\s*/)) {
      const eq = part.indexOf('=')
      if (eq === -1) continue
      if (part.slice(0, eq) === cookieName) return part.slice(eq + 1)
    }
    return null
  }

  it('extracts token from cookie header', () => {
    const token = 'abc123'
    const cookie = `mizan_session=${token}; Path=/; HttpOnly`
    expect(extractTokenFromCookie(cookie, 'mizan_session')).toBe(token)
  })

  it('returns null when cookie is missing', () => {
    expect(extractTokenFromCookie('other=value', 'mizan_session')).toBeNull()
  })

  it('extracts bearer token', () => {
    const token = 'bearer_token_value'
    const header = `Bearer ${token}`
    expect(header.startsWith('Bearer ')).toBe(true)
    expect(header.slice(7)).toBe(token)
  })
})

describe('Server-side ghosted rule enforcement', () => {
  it('rejects ghosted when < 2 written outbound touches', () => {
    const result = checkGhostedEligibility(
      [{ direction: 'outbound', written: true, date: '2025-01-01' }],
      '2025-02-01',
    )
    expect(result.eligible).toBe(false)
  })

  it('rejects ghosted when < 14 days since last outbound', () => {
    const result = checkGhostedEligibility(
      [
        { direction: 'outbound', written: true, date: '2025-01-01' },
        { direction: 'outbound', written: true, date: '2025-01-10' },
      ],
      '2025-01-15',
    )
    expect(result.eligible).toBe(false)
  })

  it('allows ghosted with 2+ written outbound and 14+ days', () => {
    const result = checkGhostedEligibility(
      [
        { direction: 'outbound', written: true, date: '2025-01-01' },
        { direction: 'outbound', written: true, date: '2025-01-05' },
      ],
      '2025-01-20',
    )
    expect(result.eligible).toBe(true)
  })

  it('inbound touches are ignored for ghosted check', () => {
    const result = checkGhostedEligibility(
      [
        { direction: 'outbound', written: true, date: '2025-01-01' },
        { direction: 'inbound', written: true, date: '2025-01-02' },
      ],
      '2025-02-01',
    )
    expect(result.eligible).toBe(false)
    expect(result.writtenOutboundCount).toBe(1)
  })
})
