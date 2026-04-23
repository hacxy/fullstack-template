# Controller 规范

> 基于 `src/controllers/userController.ts` 1 个文件分析得出。

## 概述

Controller 同时承担路由定义和请求处理，通过 `new Elysia({ prefix })` 定义前缀，`.use(Model)` 注入类型模型，handler 只做参数解构后委托给 Service。

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
  .get('/', () => UserService.findAll(), { ... })
  .post('/', ({ body }) => UserService.create(body), { ... })

// postController 示例
export const postController = new Elysia({ prefix: '/api/posts' })
  .use(PostModel)
  .get('/', () => PostService.findAll(), { ... })

// 带 ID 参数的路由
export const userController = new Elysia({ prefix: '/api/users' })
  .get('/:id', ({ params: { id } }) => UserService.findById(Number(id)), { ... })
```

**❌ 错误写法：**
```ts
// 不要在根 app 上直接加路由
app.get('/api/users', () => UserService.findAll())

// 不要多个 controller 共用同一个 Elysia 实例
export const controller = new Elysia({ prefix: '/api' })
  .get('/users', () => UserService.findAll())
  .get('/posts', () => PostService.findAll())

// 不要在 app.ts 里内联路由而不抽成 controller
export const app = new Elysia()
  .get('/api/users', () => db.select().from(users))
```

---

### 注入 Model

在路由定义前调用 `.use(Model)` 注入对应 domain 的 Elysia model，然后在路由的 `body`/`response` 字段中引用 model key（字符串形式）。

**✅ 正确写法：**
```ts
// body 校验
.post('/', ({ body }) => UserService.create(body), {
  body: 'user.create',
  response: 'user.item',
})

// 只有 response 约束
.get('/', () => UserService.findAll(), {
  response: 'user.list',
})

// 带 path 参数的 response 约束
.get('/:id', ({ params }) => UserService.findById(Number(params.id)), {
  response: 'user.item',
})
```

**❌ 错误写法：**
```ts
// 不要在 handler 里手动做类型断言代替 model
.post('/', ({ body }) => {
  const data = body as { name: string }
  return UserService.create(data)
})

// 不要忘记注入 Model 就使用 model key
export const userController = new Elysia({ prefix: '/api/users' })
  .get('/', () => UserService.findAll(), { response: 'user.list' }) // 缺少 .use(UserModel)

// 不要在 controller 里重复定义 model 已有的 schema
.post('/', ({ body }) => UserService.create(body), {
  body: t.Object({ name: t.String() }),  // 应引用 'user.create' 而非内联
})
```

---

### Handler 保持极薄

Handler 只做参数解构，立即委托给 Service，不含任何业务逻辑。

**✅ 正确写法：**
```ts
// 无参数，直接委托
.get('/', () => UserService.findAll(), { ... })

// 解构 body，直接委托
.post('/', ({ body }) => UserService.create(body), { ... })

// 解构 params，类型转换后委托
.get('/:id', ({ params: { id } }) => UserService.findById(Number(id)), { ... })
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

// 不要在 handler 里做数据转换
.post('/', ({ body }) => {
  const sanitized = { name: body.name.trim().toLowerCase() }
  return UserService.create(sanitized)
}, { ... })
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
.get('/', () => UserService.findAll(), { response: 'user.list' })

// detail 不完整（缺 description）
detail: { tags: ['Users'], summary: 'Get all users' }

// tags 使用不一致的格式
detail: { tags: ['user'], summary: 'Get users', description: '...' }  // 应统一 PascalCase
```
