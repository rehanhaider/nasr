import { z } from 'zod'

export const prayerStatus = z.enum(['ontime', 'qada', 'missed']).nullable()
export type PrayerStatus = z.infer<typeof prayerStatus>

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const deenDaySchema = z.object({
  date: dateString,
  fajr: prayerStatus.default(null),
  dhuhr: prayerStatus.default(null),
  asr: prayerStatus.default(null),
  maghrib: prayerStatus.default(null),
  isha: prayerStatus.default(null),
  morning_adhkar: z.boolean().default(false),
  evening_adhkar: z.boolean().default(false),
  night_ayat: z.boolean().default(false),
  ruqyah: z.boolean().default(false),
  istighfar_count: z.coerce.number().int().min(0).default(0),
  note: z.string().nullable().default(null),
})

export const deenDayUpdateSchema = deenDaySchema.partial().required({ date: true })

export const sadaqahEntrySchema = z.object({
  id: z.string().optional(),
  date: dateString,
  note: z.string().nullable().default(null),
  amount: z.coerce.number().nullable().default(null),
})

export const sadaqahCreateSchema = sadaqahEntrySchema.omit({ id: true })

export const observationSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(),
  text: z.string().min(1),
})

export const observationCreateSchema = z.object({
  text: z.string().min(1),
})

export type DeenDay = z.infer<typeof deenDaySchema>
export type DeenDayUpdate = z.infer<typeof deenDayUpdateSchema>
export type SadaqahEntry = z.infer<typeof sadaqahEntrySchema>
export type SadaqahCreate = z.infer<typeof sadaqahCreateSchema>
export type Observation = z.infer<typeof observationSchema>
export type ObservationCreate = z.infer<typeof observationCreateSchema>
