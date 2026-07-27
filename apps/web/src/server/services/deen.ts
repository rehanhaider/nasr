import { db } from '../../db/index.js'
import { deenDays, sadaqahLog, observations } from '../../db/schema.js'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import type { DeenDay, DeenDayUpdate, SadaqahCreate, ObservationCreate } from '@mizan/shared'

export function getDaysByRange(startDate: string, endDate: string): DeenDay[] {
  return db
    .select()
    .from(deenDays)
    .where(and(gte(deenDays.date, startDate), lte(deenDays.date, endDate)))
    .orderBy(deenDays.date)
    .all()
    .map(normalizeDay)
}

export function getDay(date: string): DeenDay | null {
  const row = db.select().from(deenDays).where(eq(deenDays.date, date)).get()
  return row ? normalizeDay(row) : null
}

export function upsertDay(data: DeenDayUpdate): DeenDay {
  const existing = getDay(data.date)
  const merged = {
    date: data.date,
    fajr: data.fajr ?? existing?.fajr ?? null,
    dhuhr: data.dhuhr ?? existing?.dhuhr ?? null,
    asr: data.asr ?? existing?.asr ?? null,
    maghrib: data.maghrib ?? existing?.maghrib ?? null,
    isha: data.isha ?? existing?.isha ?? null,
    morning_adhkar: data.morning_adhkar ?? existing?.morning_adhkar ?? false,
    evening_adhkar: data.evening_adhkar ?? existing?.evening_adhkar ?? false,
    night_ayat: data.night_ayat ?? existing?.night_ayat ?? false,
    ruqyah: data.ruqyah ?? existing?.ruqyah ?? false,
    istighfar_count: data.istighfar_count ?? existing?.istighfar_count ?? 0,
    note: data.note !== undefined ? data.note : (existing?.note ?? null),
  }

  db.insert(deenDays)
    .values(merged)
    .onConflictDoUpdate({ target: deenDays.date, set: merged })
    .run()

  return getDay(data.date)!
}

function normalizeDay(row: typeof deenDays.$inferSelect): DeenDay {
  return {
    date: row.date,
    fajr: (row.fajr as DeenDay['fajr']) ?? null,
    dhuhr: (row.dhuhr as DeenDay['dhuhr']) ?? null,
    asr: (row.asr as DeenDay['asr']) ?? null,
    maghrib: (row.maghrib as DeenDay['maghrib']) ?? null,
    isha: (row.isha as DeenDay['isha']) ?? null,
    morning_adhkar: row.morning_adhkar ?? false,
    evening_adhkar: row.evening_adhkar ?? false,
    night_ayat: row.night_ayat ?? false,
    ruqyah: row.ruqyah ?? false,
    istighfar_count: row.istighfar_count ?? 0,
    note: row.note ?? null,
  }
}

export function getSadaqahEntries(startDate?: string, endDate?: string) {
  let query = db.select().from(sadaqahLog).orderBy(desc(sadaqahLog.date))
  if (startDate && endDate) {
    return db
      .select()
      .from(sadaqahLog)
      .where(and(gte(sadaqahLog.date, startDate), lte(sadaqahLog.date, endDate)))
      .orderBy(desc(sadaqahLog.date))
      .all()
  }
  return query.all()
}

export function createSadaqah(data: SadaqahCreate) {
  const id = randomBytes(8).toString('hex')
  db.insert(sadaqahLog).values({ id, ...data }).run()
  return db.select().from(sadaqahLog).where(eq(sadaqahLog.id, id)).get()!
}

export function getObservations() {
  return db.select().from(observations).orderBy(desc(observations.timestamp)).all()
}

export function createObservation(data: ObservationCreate) {
  const id = randomBytes(8).toString('hex')
  const timestamp = new Date().toISOString()
  db.insert(observations).values({ id, timestamp, text: data.text }).run()
  return db.select().from(observations).where(eq(observations.id, id)).get()!
}

export function deleteObservation(id: string): boolean {
  const result = db.delete(observations).where(eq(observations.id, id)).run()
  return result.changes > 0
}
