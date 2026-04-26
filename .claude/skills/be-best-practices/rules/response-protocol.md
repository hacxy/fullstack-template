# 统一响应协议规范

> 基于 `packages/elysia-response/`、`src/app.ts`、`src/models/userModel.ts`、`src/controllers/userController.ts` 分析得出。

## 概述

所有 HTTP 响应统一使用 `{ code, msg, data }` 信封结构，由 `elysia-response` 插件（workspace package）集中处理。Controller/Service 只返回领域数据或 throw 错误，插件负责自动包裹。

## 响应结构

```json
// 成功响应
{ "code": 0, "msg": "ok", "data": { ... } }

// 错误响应
{ "code": 1001, "msg": "Request validation failed", "data": null }
```

## 内置错误码映射

| 错误键 | code | HTTP 状态码 | 默认消息 |
|--------|------|------------|---------|
| `VALIDATION` | 1001 | 422 | Request validation failed |
| `PARSE` | 1002 | 400 | Request payload parse failed |
| `NOT_FOUND` | 1004 | 404 | Resource not found |
| `INTERNAL_SERVER_ERROR` | 1500 | 500 | Internal server error |

## 规则

### Controller/Service 只返回领域数据

不手动构造 `{ code, msg, data }` 结构，`response()` 插件自动包裹成功响应。

**✅ 正确写法：**
```ts
// 来自 src/controllers/userController.ts — 直接返回 service 结果
.get('/', async () => {
  return UserService.findAll()   // 返回 User[]，插件包裹为 { code: 0, msg: 'ok', data: [...] }
})

.post('/', async ({ body }) => {
  return UserService.create(body)  // 返回 User，插件包裹为 { code: 0, msg: 'ok', data: {...} }
})

// service 只返回领域数据
static findAll() {
  return db.select().from(users)  // 返回 User[]
}

static async create(data: { name: string }) {
  const rows = await db.insert(users).values(data).returning()
  return rows[0]  // 返回 User
}
```

**❌ 错误写法：**
```ts
// 不要手动包裹 { code, msg, data }（会被 response 插件二次包裹）
.get('/', async () => {
  const data = await UserService.findAll()
  return { code: 0, msg: 'ok', data }
})

// 不要在 service 里包裹
static findAll() {
  const users = db.select().from(users)
  return { code: 0, msg: 'ok', data: users }
}

// 不要在 controller 里同时包裹和返回
.get('/', async () => ({ success: true, result: await UserService.findAll() }))
```

---

### Model 中用 responseContract 定义响应 schema

用 `responseContract` 工厂的方法创建响应 schema，不手写 `{ code, msg, data }` 的 TypeBox 结构。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts
import { responseContract } from 'elysia-response'

'common.error':      responseContract.createErrorResponseSchema(),
'user.responseItem': responseContract.createSuccessResponseSchema(userItemSchema),
'user.responseList': responseContract.createSuccessResponseSchema(t.Array(userItemSchema)),
```

**❌ 错误写法：**
```ts
// 手写 { code, msg, data } TypeBox 结构（与 response 插件行为可能不一致）
'user.responseItem': t.Object({
  code: t.Literal(0),
  msg: t.String(),
  data: userItemSchema,
})

// 不导入 responseContract，用 t.Any() 兜底
'user.responseItem': t.Any()

// 用 t.Union 手写成功/失败两种结构
'user.responseItem': t.Union([
  t.Object({ code: t.Literal(0), data: userItemSchema }),
  t.Object({ code: t.Number(), data: t.Null() }),
])
```

---

### Controller 的 response 字段覆盖所有状态码

每个路由的 `response` 字段必须映射 200 和所有可能的错误码（400/404/422/500），使 OpenAPI 文档完整。

**✅ 正确写法：**
```ts
// 来自 src/controllers/userController.ts
response: {
  200: 'user.responseList',
  400: 'common.error',
  404: 'common.error',
  422: 'common.error',
  500: 'common.error',
},

// POST 同样覆盖所有错误码
response: {
  200: 'user.responseItem',
  400: 'common.error',
  404: 'common.error',
  422: 'common.error',
  500: 'common.error',
},
```

**❌ 错误写法：**
```ts
// 只写 200，不写错误码（OpenAPI 文档不完整）
response: { 200: 'user.responseList' }

// 错误码用 'any' 代替（丢失类型信息）
response: { 200: 'user.responseItem', 422: t.Any() }

// 完全省略 response 字段
.get('/', async () => UserService.findAll(), {
  detail: { ... },
})  // 缺少 response 定义
```

---

### 错误由插件自动捕获和转换

Controller/Service 直接 throw 原生 Error，无需捕获后手动返回 `{ code, msg, data: null }` 格式，`response()` 插件根据 Elysia 错误类型自动映射状态码和 `code` 字段。

**✅ 正确写法：**
```ts
// service 直接 throw
static async findById(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id))
  if (!rows[0]) throw new NotFoundError()  // Elysia 内置错误类型，自动映射 404
  return rows[0]
}

// service 让 DB 错误自然冒泡
static async create(data: { name: string }) {
  const rows = await db.insert(users).values(data).returning()
  return rows[0]  // 若 DB 报错，自动映射为 500
}
```

**❌ 错误写法：**
```ts
// 捕获后手动构造错误响应
.get('/:id', async ({ params }) => {
  try {
    return UserService.findById(Number(params.id))
  } catch (e) {
    return { code: 1004, msg: 'not found', data: null }  // 应让 response 插件处理
  }
})

// 在 service 里吞掉错误并返回空数据
static async findById(id: number) {
  try {
    const rows = await db.select()...
    return rows[0]
  } catch {
    return null  // 掩盖了错误，插件无法正确包装错误响应
  }
}
```
