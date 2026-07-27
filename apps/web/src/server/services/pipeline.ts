import { db } from '../../db/index.js'
import { opportunities, touches } from '../../db/schema.js'
import { eq, desc } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import { checkGhostedEligibility, getToday } from '@mizan/shared'
import type {
  OpportunityCreate,
  OpportunityUpdate,
  TouchCreate,
  Opportunity,
  Touch,
} from '@mizan/shared'
import { getSettings } from './settings.js'

export interface OpportunityWithMeta extends Opportunity {
  last_touch_date: string | null
  written_outbound_count: number
}

export function getOpportunities(): OpportunityWithMeta[] {
  const opps = db.select().from(opportunities).orderBy(desc(opportunities.opened_date)).all() as Opportunity[]
  return opps.map((opp) => ({
    ...opp,
    last_touch_date: getLastTouchDate(opp.id),
    written_outbound_count: getWrittenOutboundCount(opp.id),
  }))
}

export function getOpportunity(id: string): Opportunity | null {
  const row = db.select().from(opportunities).where(eq(opportunities.id, id)).get()
  return (row as Opportunity) ?? null
}

export function createOpportunity(data: OpportunityCreate): Opportunity {
  const id = randomBytes(8).toString('hex')
  db.insert(opportunities).values({ id, ...data } as typeof opportunities.$inferInsert).run()
  return getOpportunity(id)!
}

export function updateOpportunity(data: OpportunityUpdate): Opportunity | { error: string } {
  const existing = getOpportunity(data.id)
  if (!existing) return { error: 'Opportunity not found' }

  if (data.status === 'ghosted' && existing.status !== 'ghosted') {
    const oppTouches = getTouchesForOpportunity(data.id)
    const settings = getSettings()
    const today = getToday(settings.timezone)
    const eligibility = checkGhostedEligibility(oppTouches, today)
    if (!eligibility.eligible) {
      return { error: eligibility.reason ?? 'Not eligible for ghosted status' }
    }
  }

  const updates: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'id' && value !== undefined) {
      updates[key] = value
    }
  }

  if (data.status && data.status !== 'open' && !existing.closed_date) {
    updates.closed_date = getToday(getSettings().timezone)
    updates.stage_at_close = data.stage ?? existing.stage
  }
  if (data.status === 'open' && existing.status !== 'open') {
    updates.closed_date = null
    updates.stage_at_close = null
  }

  db.update(opportunities).set(updates).where(eq(opportunities.id, data.id)).run()
  return getOpportunity(data.id)!
}

export function deleteOpportunity(id: string): boolean {
  const result = db.delete(opportunities).where(eq(opportunities.id, id)).run()
  return result.changes > 0
}

export function getTouchesForOpportunity(opportunityId: string): Touch[] {
  return db
    .select()
    .from(touches)
    .where(eq(touches.opportunity_id, opportunityId))
    .orderBy(desc(touches.date))
    .all() as Touch[]
}

export function createTouch(data: TouchCreate): Touch {
  const id = randomBytes(8).toString('hex')
  db.insert(touches).values({ id, ...data } as typeof touches.$inferInsert).run()
  return db.select().from(touches).where(eq(touches.id, id)).get() as Touch
}

export function getLastTouchDate(opportunityId: string): string | null {
  const touch = db
    .select({ date: touches.date })
    .from(touches)
    .where(eq(touches.opportunity_id, opportunityId))
    .orderBy(desc(touches.date))
    .limit(1)
    .get()
  return touch?.date ?? null
}

export function getWrittenOutboundCount(opportunityId: string): number {
  return db
    .select()
    .from(touches)
    .where(eq(touches.opportunity_id, opportunityId))
    .all()
    .filter((t) => t.direction === 'outbound' && t.written)
    .length
}
