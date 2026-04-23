# 应用结构规范

> 基于 `src/index.ts`、`src/app.ts` 2 个文件分析得出。

## 概述

`index.ts` 只负责启动（migration + listen），`app.ts` 负责组装中间件和 controller，两者职责分离。

## 规则

### index.ts 职责

仅执行：运行 migration → 启动监听，不包含任何路由或业务逻辑。

**✅ 正确写法：**
```ts
// 来自 src/index.ts — migration + listen
async function start() {
  const migrationsFolder = process.env.MIGRATIONS_DIR
    ?? path.join(path.dirname(process.execPath), 'drizzle')
  await migrate(db, { migrationsFolder })
  app.listen(Number(process.env.PORT) || 3000, ({ hostname, port }) => {
    consola.success(`Server running at http://${hostname}:${port}`)
  })
}
start()

// MIGRATIONS_DIR 支持生产部署时指定路径
const migrationsFolder = process.env.MIGRATIONS_DIR ?? path.join(...)

// PORT 从环境变量读取，有默认值
app.listen(Number(process.env.PORT) || 3000, ...)
```

**❌ 错误写法：**
```ts
// 不要在 index.ts 里定义路由
app.get('/api/users', () => UserService.findAll())
app.post('/api/users', ({ body }) => UserService.create(body))

// 不要在 index.ts 里注册中间件
const app = new Elysia()
  .use(cors(...))
  .use(swagger(...))
  .listen(3000)  // 中间件应在 app.ts 中组装

// 不要跳过 migration 直接启动
app.listen(3000)  // 生产环境首次启动会缺少表结构
```

---

### app.ts 职责

使用链式调用组装 cors → response plugin → swagger → controllers，导出 `app` 实例和 `App` 类型。

**✅ 正确写法：**
```ts
// 来自 src/app.ts — 链式组装
import { response } from 'elysia-plugin-response'

export const app = new Elysia()
  .use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  .use(response())
  .get('/', () => ({ status: 'ok' }))
  .use(swagger({ path: '/scalar', documentation: { ... } }))
  .use(userController)

// 导出 App 类型（供 Eden treaty 等客户端推断使用）
export type App = typeof app

// 新增 controller 时追加
export const app = new Elysia()
  .use(cors(...))
  .use(response())
  .use(swagger(...))
  .use(userController)
  .use(postController)  // 追加在末尾
```

**❌ 错误写法：**
```ts
// 不要在 app.ts 里写业务逻辑
export const app = new Elysia()
  .use(cors(...))
  .get('/api/users', () => db.select().from(users))  // 直接写查询

// 不要内联路由而不抽成 controller
export const app = new Elysia()
  .get('/api/users', () => UserService.findAll())   // 应封装为 userController
  .post('/api/users', ({ body }) => UserService.create(body))

// 不要忘记导出 App 类型
export const app = new Elysia().use(cors(...))
// 缺少 export type App = typeof app
```

---

### 注册新 Controller

在 `app.ts` 末尾追加 `.use(newController)`，并更新顶部 import。

**✅ 正确写法：**
```ts
// app.ts — import 顶部，use 末尾
import { postController } from './controllers/postController.js'
import { userController } from './controllers/userController.js'

export const app = new Elysia()
  .use(cors(...))
  .use(swagger(...))
  .use(userController)
  .use(postController)

// controller 文件中导出具名常量
export const postController = new Elysia({ prefix: '/api/posts' })
  .use(PostModel)
  .get('/', () => PostService.findAll(), { ... })
```

**❌ 错误写法：**
```ts
// 不要把 controller 注册写到 index.ts
// index.ts
app.use(postController)  // 应在 app.ts

// 不要在 app.ts 内联定义 controller 逻辑
export const app = new Elysia()
  .use(new Elysia({ prefix: '/api/posts' })  // 应提取为独立 controller 文件
    .get('/', () => PostService.findAll()))

// 不要在 controller 间有顺序依赖（每个 controller 应独立）
export const app = new Elysia()
  .use(authController)    // ← 其他 controller 不能依赖此 controller 的副作用
  .use(userController)
```

---

### 环境变量默认值

中间件所需的环境变量在代码中提供合理默认值，开发环境无需 `.env`。

**✅ 正确写法：**
```ts
// 来自 src/app.ts
.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))

// 来自 src/index.ts
app.listen(Number(process.env.PORT) || 3000, ...)

// 来自 src/db/index.ts
const dbPath = (process.env.DATABASE_URL ?? 'file:./sqlite.db').replace(/^file:/, '')
```

**❌ 错误写法：**
```ts
// 无默认值，环境变量缺失会 crash
.use(cors({ origin: process.env.CORS_ORIGIN! }))  // 强制非空，缺失就报错

// 默认值硬编码生产地址
.use(cors({ origin: process.env.CORS_ORIGIN ?? 'https://myapp.com' }))  // 开发时跨域

// 不使用环境变量，完全硬编码
app.listen(3000, ...)
.use(cors({ origin: 'http://localhost:5173' }))
```
