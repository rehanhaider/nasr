import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'
import { db } from '../db/index.js'
import { settings, sessions } from '../db/schema.js'
import { eq, and } from 'drizzle-orm'

const LOCKOUT_MINUTES = 10
const MAX_ATTEMPTS = 5
const SESSION_COOKIE = 'nasr_session'

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(pin, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  const hashBuffer = Buffer.from(hash, 'hex')
  const testHash = scryptSync(pin, salt, 64)
  return timingSafeEqual(hashBuffer, testHash)
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getSetting(key: string): string | null {
  const row = db.select().from(settings).where(eq(settings.key, key)).get()
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run()
}

function isLockedOut(): boolean {
  const until = getSetting('lockout_until')
  if (!until) return false
  return new Date(until).getTime() > Date.now()
}

function recordFailedAttempt(): boolean {
  const current = parseInt(getSetting('failed_attempts') ?? '0', 10)
  const next = current + 1
  setSetting('failed_attempts', String(next))
  if (next >= MAX_ATTEMPTS) {
    const lockoutUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
    setSetting('lockout_until', lockoutUntil)
    return true
  }
  return false
}

function clearFailedAttempts(): void {
  setSetting('failed_attempts', '0')
  setSetting('lockout_until', '')
}

export function isPinSet(): boolean {
  return getSetting('pin_hash') !== null
}

export function setPin(pin: string): void {
  setSetting('pin_hash', hashPin(pin))
}

export interface LoginResult {
  success: boolean
  token?: string
  error?: string
  lockedOut?: boolean
}

export function login(pin: string): LoginResult {
  if (isLockedOut()) {
    return { success: false, error: 'Too many attempts. Try again later.', lockedOut: true }
  }

  const stored = getSetting('pin_hash')
  if (!stored) {
    return { success: false, error: 'PIN not configured' }
  }

  if (!verifyPin(pin, stored)) {
    const locked = recordFailedAttempt()
    return {
      success: false,
      error: locked
        ? 'Too many attempts. Locked for 10 minutes.'
        : 'Invalid PIN',
      lockedOut: locked,
    }
  }

  clearFailedAttempts()

  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const now = new Date().toISOString()

  db.insert(sessions)
    .values({ token_hash: tokenHash, created_at: now, last_seen_at: now, revoked: false })
    .run()

  return { success: true, token }
}

export function logout(token: string): void {
  const tokenHash = hashToken(token)
  db.update(sessions)
    .set({ revoked: true })
    .where(eq(sessions.token_hash, tokenHash))
    .run()
}

export function validateSession(token: string): boolean {
  const tokenHash = hashToken(token)
  const session = db
    .select()
    .from(sessions)
    .where(and(eq(sessions.token_hash, tokenHash), eq(sessions.revoked, false)))
    .get()

  if (!session) return false

  db.update(sessions)
    .set({ last_seen_at: new Date().toISOString() })
    .where(eq(sessions.token_hash, tokenHash))
    .run()

  return true
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    for (const part of cookieHeader.split(/;\s*/)) {
      const eq = part.indexOf('=')
      if (eq === -1) continue
      if (part.slice(0, eq) === SESSION_COOKIE) {
        return part.slice(eq + 1)
      }
    }
  }

  return null
}

export function requireAuth(request: Request): Response | null {
  const token = extractToken(request)
  if (!token || !validateSession(token)) {
    return json({ error: 'Unauthorized' }, 401)
  }
  return null
}

export function makeSessionCookie(token: string): string {
  return [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${60 * 60 * 24 * 7}`,
  ].join('; ')
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}
