import { db } from '../../db/index.js'
import { deenDays, sadaqahLog, observations, settings } from '../../db/schema.js'
import { desc } from 'drizzle-orm'
import { getDeenContent } from './content.js'

export function exportAllJson() {
  return {
    exported_at: new Date().toISOString(),
    settings: db.select().from(settings).all(),
    deen_days: db.select().from(deenDays).all(),
    deen_content: getDeenContent(),
    sadaqah_log: db.select().from(sadaqahLog).all(),
    observations: db.select().from(observations).orderBy(desc(observations.timestamp)).all(),
  }
}

export function exportDeenCsv(): string {
  const days = db.select().from(deenDays).orderBy(deenDays.date).all()
  const headers = [
    'date', 'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
    'morning_adhkar', 'evening_adhkar', 'night_ayat_kursi', 'night_baqarah',
    'night_three_suras', 'ruqyah',
    'istighfar_count', 'note',
  ]
  const rows = days.map((d) =>
    headers.map((h) => csvEscape(String(d[h as keyof typeof d] ?? ''))).join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
