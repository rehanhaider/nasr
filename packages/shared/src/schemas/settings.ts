import { z } from 'zod'

export const settingsSchema = z.object({
  timezone: z.string().default('Asia/Kolkata'),
  cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  pipeline_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  istighfar_target: z.coerce.number().int().positive().default(100),
  live_target: z.coerce.number().int().positive().default(10),
})

export const settingsUpdateSchema = settingsSchema.partial()

/**
 * Wiping every logged entry is irreversible from inside the app, so the client
 * has to spell the word out — a stray POST cannot clear the database.
 */
export const resetRequestSchema = z.object({
  confirm: z.literal('RESET'),
})

export const resetResponseSchema = z.object({
  backup_path: z.string(),
  deleted: z.record(z.number()),
})

export type Settings = z.infer<typeof settingsSchema>
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
export type ResetRequest = z.infer<typeof resetRequestSchema>
export type ResetResponse = z.infer<typeof resetResponseSchema>
