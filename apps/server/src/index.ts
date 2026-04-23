import path from 'node:path'
import process from 'node:process'
import consola from 'consola'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { app } from './app.js'
import { db } from './db/index.js'

async function start() {
  const migrationsFolder = process.env.MIGRATIONS_DIR
    ?? path.join(path.dirname(process.execPath), 'drizzle')
  await migrate(db, { migrationsFolder })
  app.listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
    consola.success(`Server running at http://${hostname}:${port}`)
  })
}

start()

export type App = typeof app
