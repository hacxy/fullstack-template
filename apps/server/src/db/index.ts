import process from 'node:process'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import * as schema from './schema'

const dbPath = (process.env.DATABASE_URL ?? 'file:./sqlite.db').replace(/^file:/, '')
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
