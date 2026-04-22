import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('User', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: int('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
