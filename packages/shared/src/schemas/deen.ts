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
  night_ayat_kursi: z.boolean().default(false),
  night_baqarah: z.boolean().default(false),
  night_three_suras: z.boolean().default(false),
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

export const deenContentItemKeySchema = z.enum([
  'morning_adhkar',
  'evening_adhkar',
  'night_ayat',
  'ruqyah',
  'istighfar',
  'sadaqah',
])

export const evidenceGradeSchema = z.enum(['sahih', 'hasan', 'mawquf'])

export const deenContentSchema = z.object({
  id: z.string(),
  item_key: deenContentItemKeySchema,
  title: z.string(),
  arabic: z.string().nullable(),
  transliteration: z.string().nullable(),
  meaning: z.string().nullable(),
  repetitions: z.string(),
  reference: z.string(),
  grade: evidenceGradeSchema,
  sort_order: z.number().int().nonnegative(),
  note: z.string().nullable(),
})

export type DeenDay = z.infer<typeof deenDaySchema>
export type DeenDayUpdate = z.infer<typeof deenDayUpdateSchema>
export type SadaqahEntry = z.infer<typeof sadaqahEntrySchema>
export type SadaqahCreate = z.infer<typeof sadaqahCreateSchema>
export type Observation = z.infer<typeof observationSchema>
export type ObservationCreate = z.infer<typeof observationCreateSchema>
export type DeenContentItemKey = z.infer<typeof deenContentItemKeySchema>
export type EvidenceGrade = z.infer<typeof evidenceGradeSchema>
export type DeenContent = z.infer<typeof deenContentSchema>
