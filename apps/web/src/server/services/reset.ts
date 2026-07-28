import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import type { ResetResponse } from '@nasr/shared'
import { sqlite } from '../../db/index.js'
import { hashToken } from '../auth.js'

/** Children before parents: touches reference opportunities. */
const WIPE_ORDER = ['touches', 'opportunities', 'observations', 'deen_days', 'sadaqah_log'] as const

/**
 * Transient auth state, not user settings: a stale lockout would otherwise
 * outlive the reset and lock you out of an empty app.
 */
const TRANSIENT_SETTINGS = ['failed_attempts', 'lockout_until']

/**
 * `<root>/data/nasr.db` → `<root>/backups`, which is where nasr-backup.service
 * and the restore instructions in the README both look.
 */
function backupsDir(): string {
  const dbPath = resolve(process.env.NASR_DB_PATH || './data/nasr.db')
  return join(dirname(dirname(dbPath)), 'backups')
}

/** `20260728-173000`, matching the nightly backup naming. */
function timestamp(): string {
  return new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
}

/**
 * VACUUM INTO refuses to overwrite, so two resets inside the same second would
 * otherwise fail on the collision. Suffix until the name is free rather than
 * dropping to millisecond precision, which keeps the filenames readable.
 */
function freeBackupPath(dir: string): string {
  const base = join(dir, `pre-reset-${timestamp()}`)
  if (!existsSync(`${base}.db`)) return `${base}.db`
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}.db`
    if (!existsSync(candidate)) return candidate
  }
}

/**
 * Deletes every logged entry and keeps the PIN and settings. A consistent
 * snapshot is written to `backups/pre-reset-<timestamp>.db` first — that file
 * is the only way back, so it is taken before anything is touched.
 *
 * `keepToken` is the caller's own session: every other session is revoked, but
 * theirs survives so triggering a reset does not log them out of the page they
 * triggered it from.
 */
export function resetData(keepToken?: string | null): ResetResponse {
  const dir = backupsDir()
  mkdirSync(dir, { recursive: true })
  const backupPath = freeBackupPath(dir)

  // VACUUM INTO writes a consistent snapshot including anything still sitting
  // in the -wal file, which a plain copy of the .db would miss.
  sqlite.prepare('VACUUM INTO ?').run(backupPath)

  const deleted: Record<string, number> = {}

  const wipe = sqlite.transaction(() => {
    for (const table of WIPE_ORDER) {
      deleted[table] = sqlite.prepare(`DELETE FROM ${table}`).run().changes
    }

    const keepHash = keepToken ? hashToken(keepToken) : null
    deleted.sessions = keepHash
      ? sqlite.prepare('DELETE FROM sessions WHERE token_hash != ?').run(keepHash).changes
      : sqlite.prepare('DELETE FROM sessions').run().changes

    const placeholders = TRANSIENT_SETTINGS.map(() => '?').join(', ')
    sqlite.prepare(`DELETE FROM settings WHERE key IN (${placeholders})`).run(...TRANSIENT_SETTINGS)
  })
  wipe()

  // Outside the transaction: SQLite refuses to VACUUM inside one.
  sqlite.exec('VACUUM')

  return { backup_path: backupPath, deleted }
}
