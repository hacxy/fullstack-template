import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'

import openapiTS, { astToString } from 'openapi-typescript'

const url = process.env.OPENAPI_URL ?? 'http://localhost:3000/scalar/json'
const outPath = resolve(import.meta.dirname, '../src/services/schema.gen.ts')

const res = await fetch(url)
if (!res.ok)
  throw new Error(`[openapi-codegen] HTTP ${res.status} from ${url}`)

const schema = await res.json()
const ast = await openapiTS(schema as Parameters<typeof openapiTS>[0])
writeFileSync(outPath, `// This file is auto-generated. Do not edit manually.\n${astToString(ast)}`)

const proc = spawnSync('bun', ['eslint', '--fix', outPath], { cwd: resolve(import.meta.dirname, '..') })
if (proc.status !== 0)
  console.warn('[openapi-codegen] eslint --fix failed:', proc.stderr?.toString())

console.log('[openapi-codegen] Generated', outPath)
