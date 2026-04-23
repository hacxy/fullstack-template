import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import consola from 'consola'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { app } from './app.js'
import { db } from './db/index.js'

function resolveMigrationsFolder() {
  const envDir = process.env.MIGRATIONS_DIR
  const candidates = [
    envDir,
    path.resolve(path.dirname(process.execPath), 'drizzle'),
    path.resolve(import.meta.dir, '../drizzle'),
  ].filter((value): value is string => Boolean(value))

  const resolved = candidates.find(candidate =>
    fs.existsSync(path.join(candidate, 'meta', '_journal.json')))

  if (!resolved) {
    throw new Error(`Cannot locate Drizzle migrations directory. Checked: ${candidates.join(', ')}`)
  }

  return resolved
}

async function start() {
  const migrationsFolder = resolveMigrationsFolder()
  await migrate(db, { migrationsFolder })
  app.listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
    consola.success(`Server running at http://${hostname}:${port}`)
  })
}

start()
