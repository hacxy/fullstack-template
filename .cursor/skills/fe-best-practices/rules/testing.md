# 测试规范

> 基于 `e2e/app.spec.ts`、`e2e/fixtures.ts`、`e2e/globals.d.ts`、`playwright.config.ts` 4 个文件分析得出。

## 概述

仅有 Playwright E2E 测试，无单元/组件测试。自定义 fixture 扩展了覆盖率收集能力（nyc + vite-plugin-istanbul）。API 通过 Playwright 网络拦截 mock。

## 规则

### 测试文件位置和命名

E2E 测试集中在项目根级 `e2e/` 目录，文件名 kebab-case，后缀 `.spec.ts`。

**✅ 正确写法：**
```
e2e/
  app.spec.ts         ← 主测试文件
  user-flow.spec.ts   ← 按功能命名
  fixtures.ts         ← 自定义 fixture
  globals.d.ts        ← 全局类型声明
```

**❌ 错误写法：**
```
src/
  App.test.tsx        // 应在 e2e/，且是 .spec.ts
e2e/
  App.spec.ts         // PascalCase，应 kebab-case
  appSpec.ts          // 缺少 .spec. 前缀，应 app.spec.ts
  app.test.ts         // 应用 .spec.ts 后缀
```

---

### 导入来自 ./fixtures

从 `./fixtures` 导入 `test` 和 `expect`，而非直接从 `@playwright/test` 导入，以确保覆盖率 fixture 生效。

**✅ 正确写法：**
```ts
// 来自 e2e/app.spec.ts
import { expect, test } from './fixtures'

// fixtures.ts 内部扩展
import { test as base } from '@playwright/test'
export const test = base.extend({ ... })
export { expect } from '@playwright/test'

// 新增测试文件同样从 fixtures 导入
// e2e/user-flow.spec.ts
import { expect, test } from './fixtures'
```

**❌ 错误写法：**
```ts
// 直接从 @playwright/test 导入（绕过覆盖率 fixture）
import { expect, test } from '@playwright/test'

// 忘记导入 expect，从 @playwright/test 补充
import { test } from './fixtures'
import { expect } from '@playwright/test'  // 应从 './fixtures'

// 混合来源
import { test } from './fixtures'
import { expect, Page } from '@playwright/test'  // Page 类型可以，expect 不行
```

---

### API Mock 方式

使用 `page.route()` 进行网络拦截，在 `page.goto()` 之前设置。

**✅ 正确写法：**
```ts
// 来自 e2e/app.spec.ts — GET mock
test('displays users', async ({ page }) => {
  await page.route(API_USERS, route =>
    route.fulfill({ json: [{ id: 1, name: 'Alice' }] }))
  await page.goto('/')
  await expect(page.getByText('Alice')).toBeVisible()
})

// 区分 GET / POST
await page.route(API_USERS, (route) => {
  if (route.request().method() === 'GET')
    return route.fulfill({ json: existing })
  return route.fulfill({ json: { id: 2, name: 'Bob' } })
})

// 空数据 mock
await page.route(API_USERS, route => route.fulfill({ json: [] }))
```

**❌ 错误写法：**
```ts
// 在 page.goto() 之后设置 route（部分请求可能已发出）
await page.goto('/')
await page.route(API_USERS, route => route.fulfill({ json: [] }))

// 不 mock API，依赖真实后端（测试不稳定）
test('displays users', async ({ page }) => {
  await page.goto('/')  // 没有 mock，依赖 localhost:3000 运行
  await expect(page.getByText('Alice')).toBeVisible()
})

// 使用 MSW（项目未安装）
import { setupServer } from 'msw/node'
const server = setupServer(rest.get(API_USERS, (req, res, ctx) => ...))
```

---

### 断言风格

优先用语义化定位方式（`getByRole`、`getByPlaceholder`、`getByText`），断言用 Playwright 的 `expect`。

**✅ 正确写法：**
```ts
// 来自 e2e/app.spec.ts
await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
await expect(page.getByPlaceholder('User name')).toBeVisible()
await expect(page.getByRole('button', { name: 'Add user' })).toBeDisabled()

// 文本断言
await expect(page.getByText('Alice')).toBeVisible()
await expect(page.getByText('No users yet. Add one above.')).toBeVisible()

// 状态断言
await expect(page.getByRole('button', { name: 'Add user' })).toBeEnabled()
```

**❌ 错误写法：**
```ts
// 用 CSS 选择器定位（脆弱）
await page.locator('.user-list li:first-child').click()
await expect(page.locator('#add-btn')).toBeVisible()

// 用 XPath 定位
await page.locator('//button[text()="Add user"]').click()

// 用 nth-child 定位（顺序变化就坏）
await expect(page.locator('ul li:nth-child(1)')).toContainText('Alice')
```

---

### 测试数据常量化

将常用 API 端点和测试数据定义为常量，复用于多个测试。

**✅ 正确写法：**
```ts
// 来自 e2e/app.spec.ts
const API_USERS = 'http://localhost:3000/api/users/'

// fixture 数据复用
const mockUsers = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]
await page.route(API_USERS, route => route.fulfill({ json: mockUsers }))
```

**❌ 错误写法：**
```ts
// 硬编码 URL，多处重复
await page.route('http://localhost:3000/api/users/', route => ...)
// 另一个测试里
await page.route('http://localhost:3000/api/users/', route => ...)

// 内联 test fixture 数据，每个测试重复定义
test('test 1', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: [{ id: 1, name: 'Alice' }] }))
})
test('test 2', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: [{ id: 1, name: 'Alice' }] }))
})
```
