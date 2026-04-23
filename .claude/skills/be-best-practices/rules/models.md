# Elysia Model 规范

> 基于 `src/models/userModel.ts` 1 个文件分析得出。

## 概述

使用 Elysia 内置的 TypeBox（`t` 对象）定义请求/响应 schema，通过 `new Elysia().model({ ... })` 注册，key 遵循 `domain.purpose` 命名约定。

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

### Key 命名约定：domain.purpose

Model key 格式为 `domain.purpose`（小写，英文点分隔）。常见 purpose：`create`（请求体）、`item`（单个响应）、`list`（列表响应）、`update`（更新请求体）。

**✅ 正确写法：**
```ts
// 来自 src/models/userModel.ts
export const UserModel = new Elysia()
  .model({
    'user.create': t.Object({ ... }),
    'user.item':   t.Object({ ... }),
    'user.list':   t.Array(t.Object({ ... })),
  })

// post domain 示例
export const PostModel = new Elysia()
  .model({
    'post.create': t.Object({ ... }),
    'post.update': t.Object({ ... }),
    'post.item':   t.Object({ ... }),
    'post.list':   t.Array(t.Object({ ... })),
  })

// auth domain 示例
export const AuthModel = new Elysia()
  .model({
    'auth.login':  t.Object({ ... }),
    'auth.token':  t.Object({ ... }),
  })
```

**❌ 错误写法：**
```ts
// 不要用 camelCase key
'userCreate': t.Object({ ... })        // 应为 'user.create'
'UserCreate': t.Object({ ... })        // PascalCase

// 不要用下划线分隔
'user_create': t.Object({ ... })       // 应为 'user.create'

// 不要跨 domain 混合在同一个 model 文件
export const AppModel = new Elysia()
  .model({
    'user.create': t.Object({ ... }),  // user domain
    'post.create': t.Object({ ... }),  // post domain — 应拆分为独立文件
  })
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

'user.item': t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'User name' }),
  createdAt: t.Date({ description: 'Creation date' }),
}),

// 带更多字段的 post.create 示例
'post.create': t.Object({
  title: t.String({ description: 'Post title', minLength: 1, maxLength: 200 }),
  content: t.String({ description: 'Post body content' }),
  authorId: t.Number({ description: 'Author user ID' }),
}),
```

**❌ 错误写法：**
```ts
// 缺少 description
'user.create': t.Object({
  name: t.String(),
})

// description 不够有意义
'user.item': t.Object({
  id: t.Number({ description: 'id' }),       // 太简短
  name: t.String({ description: 'string' }), // 描述类型而非含义
})

// 只有部分字段有 description
'user.item': t.Object({
  id: t.Number({ description: 'User ID' }),  // 有
  name: t.String(),                          // 缺少
  createdAt: t.Date(),                       // 缺少
})
```

---

### 校验规则写在 model 中

字段约束（`minLength`、`minimum`、`maxLength` 等）在 model 定义时声明，不在 service 或 controller 中重复校验。

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
  ...
}

// model 中无约束，在 controller handler 里检查
.post('/', ({ body }) => {
  if (body.name.length === 0) throw new Error('empty name')
  return UserService.create(body)
})

// 定义了 minLength 却在 service 里二次校验（重复）
name: t.String({ description: 'User name', minLength: 1 }),
// 然后在 service 里：
if (data.name.length < 1) throw new Error('...')
```
