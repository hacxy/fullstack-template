import type { Plugin } from 'vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import openapiTS, { astToString } from 'openapi-typescript'
import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'

const SERVER_SPEC_URL = 'http://localhost:3000/scalar/json'

function openapiCodegen(): Plugin {
  const outPath = resolve(__dirname, 'src/services/schema.gen.ts')
  const serverSrcPath = resolve(__dirname, '../server/src')

  async function fetchSpec(retries = 30, interval = 500): Promise<unknown> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(SERVER_SPEC_URL)
        if (!res.ok)
          throw new Error(`HTTP ${res.status}`)
        return await res.json()
      }
      catch {
        if (i < retries - 1)
          await new Promise(r => setTimeout(r, interval))
      }
    }
    throw new Error(`[openapi-codegen] Failed to reach ${SERVER_SPEC_URL}`)
  }

  async function generate() {
    const schema = await fetchSpec()
    const ast = await openapiTS(schema as Parameters<typeof openapiTS>[0])
    writeFileSync(outPath, astToString(ast))
  }

  return {
    name: 'openapi-codegen',
    async buildStart() {
      await generate()
    },
    configureServer(server) {
      generate()
        .then(() => server.ws.send({ type: 'full-reload' }))
        .catch(e => console.warn('[openapi-codegen]', (e as Error).message))

      server.watcher.add(serverSrcPath)
      server.watcher.on('change', async (file) => {
        if (!file.startsWith(serverSrcPath))
          return
        await new Promise(r => setTimeout(r, 1500)) // 等待 server 重启
        await generate().catch(e => console.warn('[openapi-codegen]', (e as Error).message))
        server.ws.send({ type: 'full-reload' })
      })
    },
  }
}

export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    openapiCodegen(),
    react(),
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'e2e'],
      extension: ['.ts', '.tsx'],
      requireEnv: true,
    }),
  ],
})
