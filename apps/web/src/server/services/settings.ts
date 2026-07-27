import { db } from '../../db/index.js'
import { settings } from '../../db/schema.js'
import { eq } from 'drizzle-orm'
import type { Settings, SettingsUpdate } from '@mizan/shared'

const SETTING_KEYS = [
  'timezone',
  'cycle_start_date',
  'pipeline_start_date',
  'istighfar_target',
  'live_target',
] as const

export function getSettings(): Settings {
  const rows = db.select().from(settings).all()
  const map = new Map(rows.map((r) => [r.key, r.value]))

  return {
    timezone: map.get('timezone') ?? 'Asia/Kolkata',
    cycle_start_date: map.get('cycle_start_date') ?? null,
    pipeline_start_date: map.get('pipeline_start_date') ?? null,
    istighfar_target: parseInt(map.get('istighfar_target') ?? '100', 10),
    live_target: parseInt(map.get('live_target') ?? '10', 10),
  }
}

export function updateSettings(updates: SettingsUpdate): Settings {
  for (const key of SETTING_KEYS) {
    if (key in updates && updates[key] !== undefined) {
      const value = updates[key] === null ? null : String(updates[key])
      db.insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
        .run()
    }
  }
  return getSettings()
}
