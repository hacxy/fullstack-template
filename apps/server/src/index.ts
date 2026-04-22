import process from 'node:process'
import consola from 'consola'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { app } from './app'
import { db } from './db'

async function start() {
  await migrate(db, { migrationsFolder: './drizzle' })
  app.listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
    consola.success(`Server running at http://${hostname}:${port}`)
  })
}

start()

export type App = typeof app
