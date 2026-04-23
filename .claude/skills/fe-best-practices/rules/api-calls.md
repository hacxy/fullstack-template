# API 请求规范

> 基于 `src/services/client.ts`、`src/services/index.ts`、`src/store/users.ts`、`scripts/generateApi.ts` 4 个文件分析得出。

## 概述

使用 openapi-fetch 作为类型安全 HTTP 客户端，类型从 `schema.gen.ts` 自动生成，API 调用封装在 Zustand store action 内。

## 规则

### Client 初始化

在 `src/services/client.ts` 中创建唯一的 openapi-fetch client 实例，以 `VITE_API_URL` 环境变量作为 baseUrl，导出 `client`。

**✅ 正确写法：**
```ts
// 来自 src/services/client.ts
import type { paths } from './schema.gen'
import createClient from 'openapi-fetch'

export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})
```

**❌ 错误写法：**
```ts
// 不要在组件或 store 里创建 client
// store/users.ts
const client = createClient<paths>({ baseUrl: '...' })  // 应在 services/client.ts 中统一创建

// 不要硬编码 baseUrl，忽略环境变量
export const client = createClient<paths>({
  baseUrl: 'http://localhost:3000',  // 应读 VITE_API_URL
})

// 不要重复创建多个 client 实例
export const userClient = createClient<paths>({ baseUrl: '...' })
export const postClient = createClient<paths>({ baseUrl: '...' })  // 应共用同一个 client
```

---

### 类型来源

所有 API 路径类型（`paths`）和 schema 类型（`components`）来自 `src/services/schema.gen.ts`，该文件由 `bun codegen:api` 生成，**禁止手动修改**。

**✅ 正确写法：**
```ts
// 来自 src/services/index.ts — barrel 导出
export { client } from './client'
export type { components, paths } from './schema.gen'

// 来自 src/store/users.ts — 从 barrel 导入
import type { components } from '../services'
import { client } from '../services'

type User = components['schemas']['user.item']

// 从 services barrel 导入 paths 类型
import type { paths } from '../services'
```

**❌ 错误写法：**
```ts
// 手动修改 schema.gen.ts
// ❌ 直接编辑 src/services/schema.gen.ts

// 手写与 schema.gen.ts 等效的类型
interface User {
  id: number
  name: string
}

// 绕过 barrel，直接从文件导入
import type { components } from '../services/schema.gen'  // 应从 '../services'
import { client } from '../services/client'               // 应从 '../services'
```

---

### 请求调用方式

使用 openapi-fetch 的解构模式，永远解构出 `data` 和 `error`。

**✅ 正确写法：**
```ts
// GET — 来自 src/store/users.ts
const { data, error } = await client.GET('/api/users/')
if (error)
  throw error
set({ users: data, loading: false })

// POST with body — 来自 src/store/users.ts
const { data, error } = await client.POST('/api/users/', { body: { name } })
if (error)
  throw error
set(state => ({ users: [...state.users, data] }))

// DELETE（假设 API 存在）
const { error } = await client.DELETE('/api/users/{id}', { params: { path: { id } } })
if (error)
  throw error
```

**❌ 错误写法：**
```ts
// 不要忽略 error 字段
const { data } = await client.GET('/api/users/')
set({ users: data ?? [] })  // data 可能是 undefined

// 不要用 .then() 链式调用
client.GET('/api/users/').then(({ data }) => set({ users: data }))

// 不要用 try/catch 包裹（openapi-fetch 不抛异常，通过 error 字段报错）
try {
  const res = await client.GET('/api/users/')
  set({ users: res.data })
} catch (e) {
  console.error(e)  // openapi-fetch 网络错误外基本不走这里
}
```

---

### 请求调用位置

API 调用在 Zustand store action 内部，组件只调用 store 暴露的方法。

**✅ 正确写法：**
```ts
// store action 内部调用 client
fetchUsers: async () => {
  set({ loading: true })
  const { data, error } = await client.GET('/api/users/')
  if (error) throw error
  set({ users: data, loading: false })
},

// 组件只调用 action
const { fetchUsers } = useUsersStore()
useEffect(() => { fetchUsers() }, [fetchUsers])

// 新增操作也封装在 store
addUser: async (name) => {
  const { data, error } = await client.POST('/api/users/', { body: { name } })
  if (error) throw error
  set(state => ({ users: [...state.users, data] }))
},
```

**❌ 错误写法：**
```ts
// 不要在组件 useEffect 里直接调用 client
useEffect(() => {
  client.GET('/api/users/').then(({ data }) => setUsers(data))
}, [])

// 不要在组件事件处理中直接调用 client
async function handleSubmit() {
  const { data } = await client.POST('/api/users/', { body: { name } })
  setUsers(prev => [...prev, data])
}

// 不要在自定义 hook 中直接调用 client（应通过 store）
function useUsers() {
  const [users, setUsers] = useState([])
  useEffect(() => {
    client.GET('/api/users/').then(({ data }) => setUsers(data))
  }, [])
  return users
}
```
