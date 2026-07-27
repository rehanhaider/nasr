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
  night_ayat: integer('night_ayat', { mode: 'boolean' }).default(false),
  ruqyah: integer('ruqyah', { mode: 'boolean' }).default(false),
  istighfar_count: integer('istighfar_count').default(0),
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

export const opportunities = sqliteTable('opportunities', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  organisation: text('organisation'),
  contact_name: text('contact_name'),
  contact_channel: text('contact_channel'),
  type: text('type').notNull(),
  source: text('source'),
  stage: text('stage').notNull(),
  status: text('status').notNull().default('open'),
  opened_date: text('opened_date').notNull(),
  closed_date: text('closed_date'),
  stage_at_close: text('stage_at_close'),
  next_action: text('next_action'),
  next_action_date: text('next_action_date'),
  notes: text('notes'),
})

export const touches = sqliteTable('touches', {
  id: text('id').primaryKey(),
  opportunity_id: text('opportunity_id')
    .notNull()
    .references(() => opportunities.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  direction: text('direction').notNull(),
  channel: text('channel').notNull(),
  written: integer('written', { mode: 'boolean' }).default(false),
  note: text('note'),
})

export const sessions = sqliteTable('sessions', {
  token_hash: text('token_hash').primaryKey(),
  created_at: text('created_at').notNull(),
  last_seen_at: text('last_seen_at').notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).default(false),
})
