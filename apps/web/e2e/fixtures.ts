import * as fs from 'node:fs'
import * as path from 'node:path'
import { test as base } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, next) => {
    await next(page)
    const coverage = await page.evaluate(() => window.__coverage__)
    if (coverage) {
      const dir = path.resolve('.nyc_output')
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(
        path.join(dir, `coverage-${Date.now()}.json`),
        JSON.stringify(coverage),
      )
    }
  },
})
export { expect } from '@playwright/test'
