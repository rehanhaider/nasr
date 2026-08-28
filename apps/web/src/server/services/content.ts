import { asc } from 'drizzle-orm'
import { DEEN_CONTENT, type DeenContent } from '@nasr/shared'
import { db } from '../../db/index.js'
import { deenContent } from '../../db/schema.js'

let seeded = false

function seedContent() {
  if (seeded) return
  db.transaction((tx) => {
    for (const item of DEEN_CONTENT) {
      tx.insert(deenContent)
        .values(item)
        .onConflictDoUpdate({ target: deenContent.id, set: item })
        .run()
    }
  })
  seeded = true
}

export function getDeenContent(): DeenContent[] {
  seedContent()
  return db.select().from(deenContent).orderBy(asc(deenContent.item_key), asc(deenContent.sort_order)).all() as DeenContent[]
}
