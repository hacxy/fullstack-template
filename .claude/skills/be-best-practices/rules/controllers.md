# Controller 规范

> 基于 `src/controllers/userController.ts` 1 个文件分析得出。

## 概述

Controller 同时承担路由定义和请求处理，通过 `new Elysia({ prefix })` 定义前缀，`.use(Model)` 注入类型模型，handler 只做参数解构后委托给 Service。响应类型使用状态码映射格式，Service 返回的领域数据由 `response()` 插件自动包裹。

## 规则

### Controller 文件命名

`camelCase`，格式为 `{domain}Controller.ts`。

**✅ 正确写法：**
```
controllers/userController.ts
controllers/postController.ts
controllers/authController.ts
```

**❌ 错误写法：**
```
controllers/UserController.ts    // PascalCase
controllers/user-controller.ts   // kebab-case
controllers/user.ts              // 缺少 Controller 后缀
```

---

### 使用前缀创建 Elysia 实例

每个 controller 用独立的 `new Elysia({ prefix: '/api/domain' })` 创建，不共用根 app 实例。

**✅ 正确写法：**
```ts
// 来自 src/controllers/userController.ts
export const userController = new Elysia({ prefix: '/api/users' })
  .use(UserModel)
  .get('/', async () => UserService.findAll(), { ... })
  .post('/', async ({ body }) => UserService.create(body), { ... })

// postController 示例
export const postController = new Elysia({ prefix: '/api/posts' })
  .use(PostModel)
  .get('/', async () => PostService.findAll(), { ... })

// 带 ID 参数的路由
export const userController = new Elysia({ prefix: '/api/users' })
  .get('/:id', async ({ params: { id } }) => UserService.findById(Number(id)), { ... })
```

**❌ 错误写法：**
```ts
// 不要在根 app 上直接加路由
app.get('/api/users', async () => UserService.findAll())

// 不要多个 controller 共用同一个 Elysia 实例
export const controller = new Elysia({ prefix: '/api' })
  .get('/users', async () => UserService.findAll())
  .get('/posts', async () => PostService.findAll())

// 不要在 app.ts 里内联路由而不抽成 controller
export const app = new Elysia()
  .get('/api/users', async () => db.select().from(users))
```

---

### Response 使用状态码映射格式

`response` 字段使用 `{ statusCode: 'model.key' }` 对象格式，200 用 `domain.responseItem`/`domain.responseList`，错误码统一用 `common.error`。

**✅ 正确写法：**
```ts
// 来自 src/controllers/userController.ts — GET 返回列表
.get('/', async () => UserService.findAll(), {
  response: {
    200: 'user.responseList',
    400: 'common.error',
    404: 'common.error',
    422: 'common.error',
    500: 'common.error',
  },
  detail: { ... },
})

// POST 返回单个对象
.post('/', async ({ body }) => UserService.create(body), {
  body: 'user.create',
  response: {
    200: 'user.responseItem',
    400: 'common.error',
    404: 'common.error',
    422: 'common.error',
    500: 'common.error',
  },
  detail: { ... },
})

// GET with path param
.get('/:id', async ({ params: { id } }) => UserService.findById(Number(id)), {
  response: {
    200: 'user.responseItem',
    400: 'common.error',
    404: 'common.error',
    500: 'common.error',
  },
  detail: { ... },
})
```

**❌ 错误写法：**
```ts
// 不要用旧的单 key 字符串格式（response() 插件已接管包裹，旧格式会导致类型不匹配）
.get('/', async () => UserService.findAll(), {
  response: 'user.list',   // 应改为状态码映射格式
})

// 不要省略错误响应 schema（OpenAPI 文档不完整）
.get('/', async () => UserService.findAll(), {
  response: { 200: 'user.responseList' },  // 缺少 400/422/500
})

// 不要在 handler 里手动包裹 { code, msg, data }（response 插件已自动处理）
.get('/', async () => {
  const data = await UserService.findAll()
  return { code: 0, msg: 'ok', data }  // 多余，会被 response 插件二次包裹
})
```

---

### Handler 保持极薄

Handler 只做参数解构，立即委托给 Service，使用 `async` 声明。

**✅ 正确写法：**
```ts
// 无参数，直接委托（来自 src/controllers/userController.ts）
.get('/', async () => UserService.findAll(), { ... })

// 解构 body，直接委托
.post('/', async ({ body }) => UserService.create(body), { ... })

// 解构 params，类型转换后委托
.get('/:id', async ({ params: { id } }) => UserService.findById(Number(id)), { ... })
```

**❌ 错误写法：**
```ts
// 不要在 handler 里写查询逻辑
.get('/', async () => {
  return db.select().from(users).where(eq(users.active, true))
}, { ... })

// 不要在 handler 里做条件判断
.post('/', async ({ body }) => {
  if (body.name.length < 2) throw new Error('too short')
  return UserService.create(body)
}, { ... })

// handler 省略 async（应与 service 的异步调用保持一致）
.get('/', () => UserService.findAll(), { ... })
```

---

### Swagger detail 必填字段

每个路由必须包含 `detail` 对象，包含 `tags`、`summary`、`description` 三个字段。

**✅ 正确写法：**
```ts
detail: {
  tags: ['Users'],
  summary: 'Get all users',
  description: 'Returns a list of all users in the database',
}

detail: {
  tags: ['Users'],
  summary: 'Create a user',
  description: 'Creates a new user and returns the created record',
}

detail: {
  tags: ['Users'],
  summary: 'Get user by ID',
  description: 'Returns a single user record by its numeric ID',
}
```

**❌ 错误写法：**
```ts
// 缺少 detail
.get('/', async () => UserService.findAll(), { response: { ... } })

// detail 不完整（缺 description）
detail: { tags: ['Users'], summary: 'Get all users' }

// tags 格式不统一
detail: { tags: ['user'], summary: 'Get users', description: '...' }  // 应 PascalCase
```
