# 测试规范

> 基于 `tests/controllers/userController.test.ts`、`tests/services/userService.test.ts` 2 个文件分析得出。

## 概述

使用 Bun 内置测试框架（`bun:test`），测试文件集中在 `tests/` 目录（镜像 `src/` 结构），通过 `mock.module()` mock 整个 db 模块，controller 测试直接构造 `Request` 对象调用 `controller.handle()`。

## 规则

### 测试文件位置和命名

`tests/` 目录结构镜像 `src/`，文件名格式 `{domain}{Layer}.test.ts`（camelCase）。

**✅ 正确写法：**
```
tests/controllers/userController.test.ts
tests/controllers/postController.test.ts
tests/services/userService.test.ts
```

**❌ 错误写法：**
```
tests/user.test.ts           // 没有镜像 src/ 层级
src/controllers/user.spec.ts // 应在 tests/ 而非 src/ 内，且用 .test. 后缀
tests/UserController.test.ts // PascalCase
```

---

### 所有导入来自 bun:test

`describe`、`it`、`expect`、`beforeEach`、`mock` 全部从 `bun:test` 导入。

**✅ 正确写法：**
```ts
// 来自 tests/controllers/userController.test.ts
import { beforeEach, describe, expect, it, mock } from 'bun:test'

// 服务测试同样
import { beforeEach, describe, expect, it, mock } from 'bun:test'

// 只需要部分 API 时按需导入
import { describe, expect, it } from 'bun:test'
```

**❌ 错误写法：**
```ts
// 不要从 jest / vitest 导入
import { describe, it, expect } from 'jest'
import { describe, it, expect } from 'vitest'

// 不要混用来源
import { describe, it } from 'bun:test'
import { expect } from 'vitest'
```

---

### mock.module 在顶层声明，动态导入被测模块

先 `mock.module()` mock db，再 `await import()` 导入被测模块，顺序不能颠倒。

**✅ 正确写法：**
```ts
// 来自 tests/controllers/userController.test.ts — 先 mock
const mockFrom = mock()
const mockReturning = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: mockFrom }),
    insert: () => ({ values: () => ({ returning: mockReturning }) }),
  },
}))

// mock 之后再动态导入
const { userController } = await import('../../src/controllers/userController')

// service 测试同样模式
mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: mockFrom }),
    insert: () => ({ values: () => ({ returning: mockReturning }) }),
  },
}))
const { UserService } = await import('../../src/services/userService')
```

**❌ 错误写法：**
```ts
// 不要在 mock.module 之前静态导入（mock 不会生效）
import { userController } from '../../src/controllers/userController'
mock.module('../../src/db', () => ({ ... }))

// 不要在 describe/it 内部调用 mock.module
describe('UserService', () => {
  mock.module('../../src/db', () => ({ ... }))  // 应在顶层
})

// 不要 mock 整个 service 来测试 controller（应 mock db）
mock.module('../../src/services/userService', () => ({
  UserService: { findAll: mock() }
}))
```

---

### beforeEach 重置 mock

每个 `describe` 块内用 `beforeEach` 重置所有 mock，保证测试隔离。

**✅ 正确写法：**
```ts
// 来自 tests/controllers/userController.test.ts
describe('GET /api/users', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockReturning.mockReset()
  })
  // ...
})

describe('POST /api/users', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockReturning.mockReset()
  })
  // ...
})

// 多个 mock 全部重置
beforeEach(() => {
  mockFrom.mockReset()
  mockReturning.mockReset()
  mockWhere.mockReset()
})
```

**❌ 错误写法：**
```ts
// 不要遗漏 beforeEach，导致上一个测试的 mock 影响下一个
describe('GET /api/users', () => {
  it('returns 200', async () => {
    mockFrom.mockResolvedValue(mockUsers)
    // ...
  })
  it('returns empty array', async () => {
    // mockFrom 仍有上一个测试的状态！
  })
})

// 不要只重置部分 mock
beforeEach(() => {
  mockFrom.mockReset()
  // 漏掉 mockReturning
})
```

---

### Controller 测试：直接调用 handle()

用 `controller.handle(new Request(...))` 发送请求，不启动真实服务器。

**✅ 正确写法：**
```ts
// GET
const res = await userController.handle(
  new Request('http://localhost/api/users'),
)

// POST with body
const res = await userController.handle(
  new Request('http://localhost/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Charlie' }),
  }),
)

// 校验失败测试（空 body）
const res = await userController.handle(
  new Request('http://localhost/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }),
)
expect(res.status).toBe(422)
```

**❌ 错误写法：**
```ts
// 不要启动真实服务器来测试 controller
app.listen(0)
const res = await fetch('http://localhost:0/api/users')

// 不要直接调用 service 来"间接"测试 controller（测不到路由/校验层）
const result = await UserService.findAll()
expect(result).toHaveLength(2)

// 不要省略 Content-Type header（导致 body 解析失败）
const res = await userController.handle(
  new Request('http://localhost/api/users', {
    method: 'POST',
    body: JSON.stringify({ name: 'Charlie' }),  // 缺少 Content-Type
  }),
)
```
