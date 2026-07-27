import { z } from 'zod'

export const settingsSchema = z.object({
  timezone: z.string().default('Asia/Kolkata'),
  cycle_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  pipeline_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  istighfar_target: z.coerce.number().int().positive().default(100),
  live_target: z.coerce.number().int().positive().default(10),
})

export const settingsUpdateSchema = settingsSchema.partial()

export type Settings = z.infer<typeof settingsSchema>
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
