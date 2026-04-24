# API 请求规范

> 基于 `src/services/client.ts`、`src/services/index.ts`、`src/store/users.ts`、`scripts/generateApi.ts` 4 个文件分析得出。

## 概述

使用 openapi-fetch 作为类型安全 HTTP 客户端，类型从 `schema.gen.ts` 自动生成。`client.ts` 导出 `client`、`unwrapApiResponse`、`getApiErrorMessage` 三个工具；store action 通过这些工具处理统一响应信封 `{ code, msg, data }`。

## 规则

### Client 文件导出内容

`src/services/client.ts` 除了 `client` 实例外，还导出 `unwrapApiResponse`、`getApiErrorMessage` 和 `ApiEnvelope` 类型。从 `../services` barrel 统一导入，不直接引用具体文件。

**✅ 正确写法：**
```ts
// 来自 src/services/client.ts
export const client = createClient<paths>({ ... })
export function unwrapApiResponse<TEnvelope extends ApiEnvelope>(payload: TEnvelope): TEnvelope['data'] { ... }
export function getApiErrorMessage(error: unknown): string { ... }
export type ApiEnvelope = SchemaMap[EnvelopeSchemaName]

// 来自 src/services/index.ts — barrel 统一导出
export { client, getApiErrorMessage, unwrapApiResponse } from './client'
export type { ApiEnvelope } from './client'
export type { components, paths } from './schema.gen'

// store 中从 barrel 导入
import type { components } from '../services'
import { client, getApiErrorMessage, unwrapApiResponse } from '../services'
```

**❌ 错误写法：**
```ts
// 不要绕过 barrel，直接从具体文件导入
import { client } from '../services/client'
import { unwrapApiResponse } from '../services/client'

// 不要在 store 里自己实现 unwrap 逻辑
const result = data?.data  // 手动取 data.data，应使用 unwrapApiResponse

// 不要忘记在 barrel index.ts 中导出新增的工具函数
// 若在 client.ts 新增了函数，必须同步更新 services/index.ts
```

---

### 响应解包：unwrapApiResponse

后端响应结构为 `{ code: 0, msg: 'ok', data: T }`，使用 `unwrapApiResponse()` 提取 `data` 字段，传入时需用信封类型断言。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts
type UserListEnvelope = components['schemas']['user.responseList']
type UserItemEnvelope = components['schemas']['user.responseItem']

// GET 响应解包
const { data, error } = await client.GET('/api/users/')
if (error) { ... }
set({
  users: unwrapApiResponse((data as UserListEnvelope)),
  loading: false,
})

// POST 响应解包
const { data, error } = await client.POST('/api/users/', { body: { name } })
if (error) { ... }
const createdUser = unwrapApiResponse((data as UserItemEnvelope))
set(state => ({ users: [...state.users, createdUser] }))
```

**❌ 错误写法：**
```ts
// 不要直接访问 data.data（类型不安全，语义不清晰）
const { data } = await client.GET('/api/users/')
set({ users: data?.data ?? [] })

// 不要用 as any 绕过类型
set({ users: (data as any).data })

// 不要省略信封类型断言（openapi-fetch 的推断类型可能不够精确）
set({ users: unwrapApiResponse(data) })  // data 类型可能不匹配 ApiEnvelope
```

---

### 错误处理：getApiErrorMessage

错误时用 `getApiErrorMessage(error)` 提取错误消息，包装为 `new Error()` throw，不直接 throw `error` 对象。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts — GET 错误
const { data, error } = await client.GET('/api/users/')
if (error) {
  set({ loading: false })
  throw new Error(getApiErrorMessage(error))
}

// POST 错误（不需要 set loading=false，无 loading 状态）
const { data, error } = await client.POST('/api/users/', { body: { name } })
if (error)
  throw new Error(getApiErrorMessage(error))

// 另一个 DELETE 示例
const { error } = await client.DELETE('/api/users/{id}', { params: { path: { id } } })
if (error)
  throw new Error(getApiErrorMessage(error))
```

**❌ 错误写法：**
```ts
// 不要直接 throw error 对象（旧模式，与新的错误协议不兼容）
if (error)
  throw error

// 不要静默忽略 error
const { data } = await client.GET('/api/users/')
set({ users: data?.data ?? [] })  // error 被忽略

// 不要手动解析 error 的 msg 字段（应用 getApiErrorMessage 统一处理）
if (error)
  throw new Error((error as any).msg || 'Request failed')
```

---

### 类型来源

所有 API 类型从 `schema.gen.ts` 的 `components['schemas']` 提取，包括信封类型。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts — 裸实体类型
type User = components['schemas']['user.item']

// 信封类型（用于 unwrapApiResponse 的类型断言）
type UserListEnvelope = components['schemas']['user.responseList']
type UserItemEnvelope = components['schemas']['user.responseItem']

// ApiEnvelope 联合类型（所有 *.response* schema 的联合）
import type { ApiEnvelope } from '../services'
```

**❌ 错误写法：**
```ts
// 不要手写类型
interface User { id: number; name: string }
interface UserResponse { code: 0; msg: string; data: User }

// 不要用 any
const user: any = unwrapApiResponse(data)

// 不要修改 schema.gen.ts（禁止手动修改自动生成文件）
```

---

### codegen 更新

修改后端 API 后，运行以下命令重新生成类型：

```bash
bun codegen:api
```

脚本从 `http://localhost:3000/scalar/json` 拉取 OpenAPI spec，写入 `src/services/schema.gen.ts`，并自动运行 `eslint --fix`。新的 `user.responseItem`、`user.responseList`、`common.error` 等信封 schema 会随之更新。
