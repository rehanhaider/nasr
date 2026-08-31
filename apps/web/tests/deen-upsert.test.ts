import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// db/index.ts reads NASR_DB_PATH once at module load, so point it at a
// throwaway database *before* anything imports it.
const root = mkdtempSync(join(tmpdir(), 'nasr-upsert-'))
const dbPath = join(root, 'data', 'nasr.db')
mkdirSync(join(root, 'data'), { recursive: true })
process.env.NASR_DB_PATH = dbPath

const MIGRATIONS = resolve(import.meta.dirname, '../migrations')

let upsertDay: typeof import('../src/server/services/deen.js')['upsertDay']
let sqlite: import('better-sqlite3').Database

beforeAll(async () => {
  const setup = new Database(dbPath)
  migrate(drizzle(setup), { migrationsFolder: MIGRATIONS })
  setup.close()

  const mod = await import('../src/db/index.js')
  sqlite = mod.sqlite
  upsertDay = (await import('../src/server/services/deen.js')).upsertDay
})

afterAll(() => {
  sqlite?.close()
  rmSync(root, { recursive: true, force: true })
})

describe('upsertDay merge semantics', () => {
  it('leaves untouched fields alone', () => {
    upsertDay({ date: '2026-01-01', fajr: 'ontime', ruqyah: true })
    const day = upsertDay({ date: '2026-01-01', dhuhr: 'qada' })
    expect(day.fajr).toBe('ontime')
    expect(day.dhuhr).toBe('qada')
    expect(day.ruqyah).toBe(true)
  })

  it('clears a prayer status when explicitly set to null', () => {
    upsertDay({ date: '2026-01-02', fajr: 'missed' })
    const day = upsertDay({ date: '2026-01-02', fajr: null })
    expect(day.fajr).toBeNull()
  })

  it('clears a boolean and resets istighfar count when explicitly set', () => {
    upsertDay({ date: '2026-01-03', ruqyah: true, istighfar_count: 100 })
    const day = upsertDay({ date: '2026-01-03', ruqyah: false, istighfar_count: 0 })
    expect(day.ruqyah).toBe(false)
    expect(day.istighfar_count).toBe(0)
  })
})
