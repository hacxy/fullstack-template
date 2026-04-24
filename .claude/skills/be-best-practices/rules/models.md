# Elysia Model 规范

> 基于 `src/models/userModel.ts` 1 个文件分析得出。

## 概述

使用 Elysia 内置的 TypeBox（`t` 对象）定义请求/响应 schema，通过 `new Elysia().model({ ... })` 注册，key 遵循 `domain.purpose` 命名约定。响应 schema 通过 `responseContract` 工厂创建，保证与统一响应协议一致。

## 规则

### Model 文件命名

`camelCase`，格式为 `{domain}Model.ts`。

**✅ 正确写法：**
```
models/userModel.ts
models/postModel.ts
models/authModel.ts
```

**❌ 错误写法：**
```
models/UserModel.ts    // PascalCase
models/user-model.ts   // kebab-case
models/user.ts         // 缺少 Model 后缀
```

---

### 提取共享 schema 变量

将多处复用的子 schema 提取为 const 变量，供 `user.item`、`user.responseItem`、`user.responseList` 共用，避免重复定义。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts
const userItemSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'User name' }),
  createdAt: t.Date({ description: 'Creation date' }),
})

export const UserModel = new Elysia()
  .model({
    'user.create': t.Object({ ... }),
    'user.item': userItemSchema,              // 引用变量
    'user.list': t.Array(userItemSchema),    // 引用变量
    'user.responseItem': responseContract.createSuccessResponseSchema(userItemSchema),
    'user.responseList': responseContract.createSuccessResponseSchema(t.Array(userItemSchema)),
  })
```

**❌ 错误写法：**
```ts
// 不要在每个 model key 里重复定义相同的字段
export const UserModel = new Elysia()
  .model({
    'user.item': t.Object({ id: t.Number(...), name: t.String(...), createdAt: t.Date(...) }),
    'user.list': t.Array(t.Object({ id: t.Number(...), name: t.String(...), createdAt: t.Date(...) })),
    'user.responseItem': responseContract.createSuccessResponseSchema(
      t.Object({ id: t.Number(...), name: t.String(...), createdAt: t.Date(...) })  // 第三次重复
    ),
  })

// 不要用 t.Ref 或 t.Recursive 引用（不必要的复杂性）
const $userItem = t.Object({ ... })
'user.item': t.Ref($userItem)
```

---

### Key 命名约定：domain.purpose

Model key 格式为 `domain.purpose`（小写，英文点分隔）。必须包含的 key：`domain.create`（请求体）、`domain.item`（裸实体）、`domain.list`（裸列表）、`common.error`（错误响应）、`domain.responseItem`（成功单条包裹）、`domain.responseList`（成功列表包裹）。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts
export const UserModel = new Elysia()
  .model({
    'user.create':       t.Object({ ... }),                                              // POST body
    'user.item':         userItemSchema,                                                 // 裸实体（内部复用）
    'user.list':         t.Array(userItemSchema),                                        // 裸列表（内部复用）
    'common.error':      responseContract.createErrorResponseSchema(),                   // 错误响应
    'user.responseItem': responseContract.createSuccessResponseSchema(userItemSchema),   // 成功单条包裹
    'user.responseList': responseContract.createSuccessResponseSchema(t.Array(userItemSchema)),  // 成功列表包裹
  })

// post domain 示例
export const PostModel = new Elysia()
  .model({
    'post.create':       t.Object({ ... }),
    'post.item':         postItemSchema,
    'post.list':         t.Array(postItemSchema),
    'common.error':      responseContract.createErrorResponseSchema(),
    'post.responseItem': responseContract.createSuccessResponseSchema(postItemSchema),
    'post.responseList': responseContract.createSuccessResponseSchema(t.Array(postItemSchema)),
  })
```

**❌ 错误写法：**
```ts
// key 用 camelCase 分隔
'userCreate': t.Object({ ... })     // 应为 'user.create'
'userResponseItem': t.Object({ ... }) // 应为 'user.responseItem'

// 缺少 common.error 定义（controller 无法引用）
export const UserModel = new Elysia()
  .model({
    'user.create': t.Object({ ... }),
    'user.responseItem': responseContract.createSuccessResponseSchema(userItemSchema),
    // 缺少 'common.error'，controller 中的 400/422/500 响应类型无法注册
  })

// 手写 { code, msg, data } 结构代替 responseContract 工厂
'user.responseItem': t.Object({
  code: t.Literal(0),
  msg: t.String(),
  data: userItemSchema,
})  // 应使用 responseContract.createSuccessResponseSchema(userItemSchema)
```

---

### 字段必须有 description

每个字段添加 `description` 属性，用于生成有意义的 OpenAPI 文档。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts
'user.create': t.Object({
  name: t.String({ description: 'User name', minLength: 1 }),
}),

const userItemSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'User name' }),
  createdAt: t.Date({ description: 'Creation date' }),
})

// 带约束的字段
'post.create': t.Object({
  title: t.String({ description: 'Post title', minLength: 1, maxLength: 200 }),
  content: t.String({ description: 'Post body content' }),
})
```

**❌ 错误写法：**
```ts
// 缺少 description
const userItemSchema = t.Object({
  id: t.Number(),
  name: t.String(),
})

// description 没有语义
id: t.Number({ description: 'number' })    // 描述类型而非含义

// 只有部分字段有 description
const userItemSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String(),   // 缺少 description
})
```

---

### 校验规则写在 model 中

字段约束（`minLength`、`minimum` 等）在 model 定义时声明，不在 service 或 controller 中重复校验。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts（minLength 防止空字符串）
name: t.String({ description: 'User name', minLength: 1 }),

// 数字范围约束
age: t.Number({ description: 'User age', minimum: 0, maximum: 150 }),

// 可选字段
bio: t.Optional(t.String({ description: 'User bio', maxLength: 500 })),
```

**❌ 错误写法：**
```ts
// model 中无约束，在 service 里手动检查
static async create(data: { name: string }) {
  if (!data.name || data.name.trim() === '')
    throw new Error('name is required')  // model 层应已处理
}

// model 中无约束，在 controller handler 里检查
.post('/', async ({ body }) => {
  if (body.name.length === 0) throw new Error('empty name')
  return UserService.create(body)
})

// 定义了 minLength 却在 service 里二次校验
name: t.String({ description: 'User name', minLength: 1 }),
// 然后在 service 里：
if (data.name.length < 1) throw new Error('...')
```
