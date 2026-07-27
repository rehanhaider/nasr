import { db } from '../../db/index.js'
import { deenDays, sadaqahLog, observations, opportunities, touches, settings } from '../../db/schema.js'
import { desc } from 'drizzle-orm'

export function exportAllJson() {
  return {
    exported_at: new Date().toISOString(),
    settings: db.select().from(settings).all(),
    deen_days: db.select().from(deenDays).all(),
    sadaqah_log: db.select().from(sadaqahLog).all(),
    observations: db.select().from(observations).orderBy(desc(observations.timestamp)).all(),
    opportunities: db.select().from(opportunities).all(),
    touches: db.select().from(touches).all(),
  }
}

export function exportDeenCsv(): string {
  const days = db.select().from(deenDays).orderBy(deenDays.date).all()
  const headers = [
    'date', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
    'morning_adhkar', 'evening_adhkar', 'night_ayat', 'ruqyah',
    'istighfar_count', 'note',
  ]
  const rows = days.map((d) =>
    headers.map((h) => csvEscape(String(d[h as keyof typeof d] ?? ''))).join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function exportPipelineCsv(): string {
  const opps = db.select().from(opportunities).all()
  const headers = [
    'id', 'name', 'organisation', 'contact_name', 'contact_channel',
    'type', 'source', 'stage', 'status', 'opened_date', 'closed_date',
    'stage_at_close', 'next_action', 'next_action_date', 'notes',
  ]
  const rows = opps.map((o) =>
    headers.map((h) => csvEscape(String(o[h as keyof typeof o] ?? ''))).join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
