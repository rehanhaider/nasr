import { z } from 'zod'

export const opportunityType = z.enum(['job', 'client', 'training', 'funding', 'other'])
export const opportunityStage = z.enum(['lead', 'conversation', 'proposal', 'commitment'])
export const opportunityStatus = z.enum(['open', 'won', 'lost', 'ghosted', 'withdrawn'])
export const touchDirection = z.enum(['outbound', 'inbound'])
export const touchChannel = z.enum(['email', 'linkedin', 'call', 'whatsapp', 'in_person', 'other'])

export const opportunitySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  organisation: z.string().nullable().default(null),
  contact_name: z.string().nullable().default(null),
  contact_channel: z.string().nullable().default(null),
  type: opportunityType,
  source: z.string().nullable().default(null),
  stage: opportunityStage,
  status: opportunityStatus.default('open'),
  opened_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closed_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  stage_at_close: opportunityStage.nullable().default(null),
  next_action: z.string().nullable().default(null),
  next_action_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().default(null),
  notes: z.string().nullable().default(null),
})

export const opportunityCreateSchema = opportunitySchema.omit({ id: true, closed_date: true, stage_at_close: true })

export const opportunityUpdateSchema = opportunitySchema.partial().required({ id: true })

export const touchSchema = z.object({
  id: z.string(),
  opportunity_id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  direction: touchDirection,
  channel: touchChannel,
  written: z.boolean().default(false),
  note: z.string().nullable().default(null),
})

export const touchCreateSchema = touchSchema.omit({ id: true })

export type OpportunityType = z.infer<typeof opportunityType>
export type OpportunityStage = z.infer<typeof opportunityStage>
export type OpportunityStatus = z.infer<typeof opportunityStatus>
export type TouchDirection = z.infer<typeof touchDirection>
export type TouchChannel = z.infer<typeof touchChannel>
export type Opportunity = z.infer<typeof opportunitySchema>
export type OpportunityCreate = z.infer<typeof opportunityCreateSchema>
export type OpportunityUpdate = z.infer<typeof opportunityUpdateSchema>
export type Touch = z.infer<typeof touchSchema>
export type TouchCreate = z.infer<typeof touchCreateSchema>
