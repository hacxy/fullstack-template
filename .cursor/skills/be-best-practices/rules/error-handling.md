# 错误处理规范

> 基于 `src/models/userModel.ts`、`src/controllers/userController.ts`、`tests/controllers/userController.test.ts` 3 个文件分析得出。当前代码无自定义全局错误处理器，部分规则为推断。

## 概述

参数校验由 Elysia TypeBox model 自动处理（返回 422），无需在 service/controller 中手动校验。当前代码没有自定义全局错误处理器。

## 规则

### 全局错误统一映射为 envelope

错误响应统一由 plugin 映射为 `{ code, msg, data }`，其中 `code != 0` 且 `data = null`。Controller/Service 只需抛错或返回领域数据，不重复手工封装。

**✅ 正确写法：**
```ts
// app.ts 中注册统一响应 plugin
import { response } from 'elysia-plugin-response'

export const app = new Elysia()
  .use(response())
  .use(userController)

// plugin 内统一映射错误
.onError(({ code, error, set }) => {
  set.status = 422
  return { code: 1001, msg: error.message, data: null }
})
```

**❌ 错误写法：**
```ts
// 在 controller 中手工构造错误 envelope（重复职责）
.post('/', async ({ body }) => {
  try {
    return await UserService.create(body)
  } catch {
    return { code: 1500, msg: 'failed', data: null }
  }
})

// service 吞错并返回“假成功”结构
static async create(data: { name: string }) {
  try {
    const rows = await db.insert(users).values(data).returning()
    return { code: 0, msg: 'ok', data: rows[0] }
  } catch {
    return { code: 1500, msg: 'failed', data: null }
  }
}
```

---

### 参数校验在 Model 中声明

不在 controller/service 中手动校验请求体，将所有输入约束声明在 Elysia model 中，由框架自动返回 422。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts — minLength 防止空字符串
'user.create': t.Object({
  name: t.String({ description: 'User name', minLength: 1 }),
}),

// 数字约束
'user.update': t.Object({
  id: t.Number({ description: 'User ID', minimum: 1 }),
  name: t.String({ description: 'User name', minLength: 1, maxLength: 100 }),
}),

// 可选字段
'post.create': t.Object({
  title: t.String({ description: 'Post title', minLength: 1 }),
  content: t.Optional(t.String({ description: 'Post content' })),
}),
```

**❌ 错误写法：**
```ts
// 在 controller handler 里手动校验（与 model 层重复）
.post('/', ({ body }) => {
  if (!body.name || body.name.length === 0)
    throw new Error('name is required')
  return UserService.create(body)
})

// 在 service 里手动校验（不是 service 职责）
static async create(data: { name: string }) {
  if (!data.name) throw new Error('name required')  // model 已校验
  ...
}

// model 无约束，依赖数据库报错来拒绝无效数据
'user.create': t.Object({
  name: t.String(),  // 没有 minLength，空字符串会进入 DB 操作
}),
```

---

### 422 是校验失败的预期状态码

Elysia 对 model 校验失败自动返回 422 Unprocessable Entity，测试中必须断言此状态码。

**✅ 正确写法（来自测试）：**
```ts
// 来自 tests/controllers/userController.test.ts
it('returns 422 when body is missing name', async () => {
  const res = await userController.handle(
    new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }),
  )
  expect(res.status).toBe(422)
})

it('returns 422 when name is empty string', async () => {
  const res = await userController.handle(
    new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    }),
  )
  expect(res.status).toBe(422)
})

// 类型不匹配同样 422
it('returns 422 when id is not a number', async () => {
  const res = await userController.handle(
    new Request('http://localhost/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123 }),  // 应为 string
    }),
  )
  expect(res.status).toBe(422)
})
```

**❌ 错误写法：**
```ts
// 期望 400（Elysia 用 422，不是 400）
expect(res.status).toBe(400)

// 不测试校验失败（导致 model 约束的正确性无法验证）
describe('POST /api/users', () => {
  it('creates a user', async () => { ... })
  // 缺少校验失败的测试用例
})

// 期望 500（校验失败不应是 500）
it('returns 500 when name is empty', async () => {
  expect(res.status).toBe(500)  // 应为 422
})
```

---

### Service 错误直接 throw

Service 遇到预期外的错误直接 throw，不包装为自定义错误类，由 Elysia 统一捕获并返回 500。

**✅ 正确写法：**
```ts
// insert 操作失败时自然抛出 Drizzle/SQLite 错误
static async create(data: { name: string }) {
  const rows = await db.insert(users).values(data).returning()
  return rows[0]  // rows[0] 可能 undefined，由调用方处理
}

// 业务层 not-found 场景
static async findById(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id))
  return rows[0] ?? null  // 返回 null，不 throw
}

// 调用方处理 null
.get('/:id', async ({ params }) => {
  const user = await UserService.findById(Number(params.id))
  if (!user) throw new NotFoundError()
  return user
}, { ... })
```

**❌ 错误写法：**
```ts
// 包装为自定义错误类（过度设计）
class UserNotFoundError extends Error {
  constructor(id: number) {
    super(`User ${id} not found`)
    this.name = 'UserNotFoundError'
  }
}
static async findById(id: number) {
  const rows = await db.select()...
  if (!rows[0]) throw new UserNotFoundError(id)
}

// 吞掉错误返回 null（调用方无法区分"未找到"和"查询失败"）
static async create(data: { name: string }) {
  try {
    const rows = await db.insert(users).values(data).returning()
    return rows[0]
  } catch {
    return null  // 掩盖了真正的错误
  }
}

// 在 service 里手动 console.error 而不 throw（错误被吞）
static async findAll() {
  try {
    return await db.select().from(users)
  } catch (e) {
    console.error(e)
    return []  // 查询失败了却返回空数组
  }
}
```
