import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
})

export const deenDays = sqliteTable('deen_days', {
  date: text('date').primaryKey(),
  fajr: text('fajr'),
  dhuhr: text('dhuhr'),
  asr: text('asr'),
  maghrib: text('maghrib'),
  isha: text('isha'),
  morning_adhkar: integer('morning_adhkar', { mode: 'boolean' }).default(false),
  evening_adhkar: integer('evening_adhkar', { mode: 'boolean' }).default(false),
  night_ayat_kursi: integer('night_ayat_kursi', { mode: 'boolean' }).default(false),
  night_baqarah: integer('night_baqarah', { mode: 'boolean' }).default(false),
  night_three_suras: integer('night_three_suras', { mode: 'boolean' }).default(false),
  ruqyah: integer('ruqyah', { mode: 'boolean' }).default(false),
  istighfar_count: integer('istighfar_count').default(0),
  note: text('note'),
})

export const deenContent = sqliteTable('deen_content', {
  id: text('id').primaryKey(),
  item_key: text('item_key').notNull(),
  title: text('title').notNull(),
  arabic: text('arabic'),
  transliteration: text('transliteration'),
  meaning: text('meaning'),
  repetitions: text('repetitions').notNull(),
  reference: text('reference').notNull(),
  grade: text('grade').notNull(),
  sort_order: integer('sort_order').notNull(),
  note: text('note'),
})

export const sadaqahLog = sqliteTable('sadaqah_log', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  note: text('note'),
  amount: integer('amount'),
})

export const observations = sqliteTable('observations', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  text: text('text').notNull(),
})

export const sessions = sqliteTable('sessions', {
  token_hash: text('token_hash').primaryKey(),
  created_at: text('created_at').notNull(),
  last_seen_at: text('last_seen_at').notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false),
})
