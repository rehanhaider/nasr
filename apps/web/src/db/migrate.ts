import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const dbPath = process.env.MIZAN_DB_PATH || './data/mizan.db'

const dir = dirname(dbPath)
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

const db = drizzle(sqlite)

const migrationsFolder = resolve(import.meta.dirname ?? '.', '../../migrations')

console.log(`Running migrations from ${migrationsFolder}...`)
migrate(db, { migrationsFolder })
console.log('Migrations complete.')

sqlite.close()
