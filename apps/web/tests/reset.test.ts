import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'

// db/index.ts reads NASR_DB_PATH once at module load, so the whole suite has to
// point at a throwaway database *before* anything imports it.
const root = mkdtempSync(join(tmpdir(), 'nasr-reset-'))
const dbPath = join(root, 'data', 'nasr.db')
mkdirSync(join(root, 'data'), { recursive: true })
process.env.NASR_DB_PATH = dbPath

const MIGRATIONS = resolve(import.meta.dirname, '../migrations')
const OWN_TOKEN = 'own-session-token'
const OTHER_TOKEN = 'other-device-token'

const hash = (token: string) => createHash('sha256').update(token).digest('hex')

let resetData: typeof import('../src/server/services/reset.js')['resetData']
let sqlite: import('better-sqlite3').Database

beforeAll(async () => {
  const setup = new Database(dbPath)
  migrate(drizzle(setup), { migrationsFolder: MIGRATIONS })
  setup.close()

  const mod = await import('../src/db/index.js')
  sqlite = mod.sqlite
  resetData = (await import('../src/server/services/reset.js')).resetData
})

afterAll(() => {
  sqlite?.close()
  rmSync(root, { recursive: true, force: true })
})

function seed() {
  sqlite.exec('DELETE FROM touches; DELETE FROM opportunities; DELETE FROM observations')
  sqlite.exec('DELETE FROM deen_days; DELETE FROM sadaqah_log; DELETE FROM sessions; DELETE FROM settings')

  sqlite
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    .run('pin_hash', 'salt:hash')
  sqlite.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('timezone', 'Asia/Kolkata')
  sqlite.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('failed_attempts', '4')
  sqlite
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?)')
    .run('lockout_until', '2099-01-01T00:00:00.000Z')

  sqlite.prepare('INSERT INTO deen_days (date) VALUES (?)').run('2026-07-01')
  sqlite.prepare('INSERT INTO deen_days (date) VALUES (?)').run('2026-07-02')
  sqlite
    .prepare('INSERT INTO opportunities (id, name, type, stage, status, opened_date) VALUES (?, ?, ?, ?, ?, ?)')
    .run('opp-1', 'Acme', 'job', 'lead', 'open', '2026-07-01')
  sqlite
    .prepare(
      'INSERT INTO touches (id, opportunity_id, date, direction, channel, written) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run('touch-1', 'opp-1', '2026-07-02', 'outbound', 'email', 1)
  sqlite
    .prepare('INSERT INTO observations (id, timestamp, text) VALUES (?, ?, ?)')
    .run('obs-1', '2026-07-02T10:00:00.000Z', 'noted')
  sqlite.prepare('INSERT INTO sadaqah_log (id, date, amount) VALUES (?, ?, ?)').run('sad-1', '2026-07-02', 50)

  const now = '2026-07-02T10:00:00.000Z'
  const insertSession = sqlite.prepare(
    'INSERT INTO sessions (token_hash, created_at, last_seen_at, revoked) VALUES (?, ?, ?, 0)',
  )
  insertSession.run(hash(OWN_TOKEN), now, now)
  insertSession.run(hash(OTHER_TOKEN), now, now)
}

const count = (table: string) =>
  (sqlite.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get() as { c: number }).c

const setting = (key: string) =>
  (sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined)?.value

describe('resetData', () => {
  it('deletes every logged entry and reports the counts', () => {
    seed()
    const result = resetData(OWN_TOKEN)

    expect(count('deen_days')).toBe(0)
    expect(count('opportunities')).toBe(0)
    expect(count('touches')).toBe(0)
    expect(count('observations')).toBe(0)
    expect(count('sadaqah_log')).toBe(0)

    expect(result.deleted).toMatchObject({
      deen_days: 2,
      opportunities: 1,
      touches: 1,
      observations: 1,
      sadaqah_log: 1,
    })
  })

  it('keeps the PIN and user settings', () => {
    seed()
    resetData(OWN_TOKEN)

    expect(setting('pin_hash')).toBe('salt:hash')
    expect(setting('timezone')).toBe('Asia/Kolkata')
  })

  it('clears the lockout so a reset cannot leave you locked out of an empty app', () => {
    seed()
    resetData(OWN_TOKEN)

    expect(setting('failed_attempts')).toBeUndefined()
    expect(setting('lockout_until')).toBeUndefined()
  })

  it('keeps the calling session and revokes the others', () => {
    seed()
    const result = resetData(OWN_TOKEN)

    const remaining = sqlite.prepare('SELECT token_hash FROM sessions').all() as { token_hash: string }[]
    expect(remaining.map((r) => r.token_hash)).toEqual([hash(OWN_TOKEN)])
    expect(result.deleted.sessions).toBe(1)
  })

  it('drops every session when there is no calling token', () => {
    seed()
    resetData(null)

    expect(count('sessions')).toBe(0)
  })

  it('writes a restorable backup before deleting anything', () => {
    seed()
    const result = resetData(OWN_TOKEN)

    expect(existsSync(result.backup_path)).toBe(true)

    const backup = new Database(result.backup_path, { readonly: true })
    try {
      const rows = backup.prepare('SELECT COUNT(*) AS c FROM opportunities').get() as { c: number }
      expect(rows.c).toBe(1)
      const day = backup.prepare('SELECT COUNT(*) AS c FROM deen_days').get() as { c: number }
      expect(day.c).toBe(2)
    } finally {
      backup.close()
    }
  })

  it('does not collide when two resets land in the same second', () => {
    seed()
    const first = resetData(OWN_TOKEN)
    seed()
    const second = resetData(OWN_TOKEN)

    expect(second.backup_path).not.toBe(first.backup_path)
    expect(existsSync(first.backup_path)).toBe(true)
    expect(existsSync(second.backup_path)).toBe(true)
  })

  it('is safe to run against an already-empty database', () => {
    seed()
    resetData(OWN_TOKEN)
    const second = resetData(OWN_TOKEN)

    expect(second.deleted).toMatchObject({ deen_days: 0, opportunities: 0, touches: 0 })
    expect(setting('pin_hash')).toBe('salt:hash')
  })
})
