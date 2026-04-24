# 状态管理规范

> 基于 `src/store/createStore.ts`、`src/store/counter.ts`、`src/store/users.ts`、`src/store/index.ts` 4 个文件分析得出。

## 概述

Zustand 5，通过项目自定义的 `createStore<T>()` 工厂函数创建 store，每个业务域一个文件，所有 store 经 `store/index.ts` barrel 导出。

## 规则

### 使用 createStore 工厂函数

所有 store 必须通过 `store/createStore.ts` 中的 `createStore<T>()` 创建，不直接调用 Zustand 的 `create()`。

**✅ 正确写法：**
```ts
// 来自 src/store/counter.ts
export const useCounterStore = createStore<CounterStore>('CounterStore', set => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 })),
}))

// 来自 src/store/users.ts
export const useUsersStore = createStore<UsersStore>('UsersStore', set => ({
  users: [],
  loading: false,
  fetchUsers: async () => { ... },
}))

// 新增 store 同样模式
export const usePostsStore = createStore<PostsStore>('PostsStore', set => ({
  posts: [],
  loading: false,
  fetchPosts: async () => { ... },
}))
```

**❌ 错误写法：**
```ts
// 直接调用 create()，绕过工厂
import { create } from 'zustand'
export const useCounterStore = create<CounterStore>()(set => ({ ... }))

// 忘记传 name 参数（devtools 无法识别 store）
export const useUsersStore = createStore<UsersStore>(set => ({ ... }))

// 不使用工厂，手动包 devtools
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
export const useUsersStore = create<UsersStore>()(devtools(set => ({ ... })))
```

---

### Store 类型定义

用 `interface` 定义 store 的完整形状（state + actions 写在同一个 interface）。

**✅ 正确写法：**
```ts
// 来自 src/store/counter.ts
interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

// 来自 src/store/users.ts
interface UsersStore {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
  addUser: (name: string) => Promise<void>
}

// 新增 store 的 interface 示例
interface PostsStore {
  posts: Post[]
  loading: boolean
  fetchPosts: () => Promise<void>
  deletePost: (id: number) => Promise<void>
}
```

**❌ 错误写法：**
```ts
// state 和 actions 分开定义（不符合项目风格）
interface CounterState { count: number }
interface CounterActions { increment: () => void }
type CounterStore = CounterState & CounterActions

// 用 type 代替 interface（项目用 interface）
type UsersStore = {
  users: User[]
  fetchUsers: () => Promise<void>
}

// 不定义类型，直接传 initializer（丢失类型安全）
export const useStore = createStore('MyStore', set => ({
  value: 0,
}))
```

---

### 异步 Action 模式

异步 action 在 store 内部定义，使用 openapi-fetch 解构模式，通过 `unwrapApiResponse` 提取数据，通过 `getApiErrorMessage` 提取错误消息后 throw。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts
import { client, getApiErrorMessage, unwrapApiResponse } from '../services'
import type { components } from '../services'

type User = components['schemas']['user.item']
type UserListEnvelope = components['schemas']['user.responseList']
type UserItemEnvelope = components['schemas']['user.responseItem']

// GET 操作：先 set loading，error 时恢复 loading 再 throw
fetchUsers: async () => {
  set({ loading: true })
  const { data, error } = await client.GET('/api/users/')
  if (error) {
    set({ loading: false })
    throw new Error(getApiErrorMessage(error))
  }
  set({ users: unwrapApiResponse((data as UserListEnvelope)), loading: false })
},

// POST 操作：无 loading 状态，error 直接 throw，成功后追加到列表
addUser: async (name) => {
  const { data, error } = await client.POST('/api/users/', { body: { name } })
  if (error)
    throw new Error(getApiErrorMessage(error))
  const createdUser = unwrapApiResponse((data as UserItemEnvelope))
  set(state => ({ users: [...state.users, createdUser] }))
},

// DELETE 操作：无需解包响应，错误直接 throw
deleteUser: async (id) => {
  const { error } = await client.DELETE('/api/users/{id}', { params: { path: { id } } })
  if (error)
    throw new Error(getApiErrorMessage(error))
  set(state => ({ users: state.users.filter(u => u.id !== id) }))
},
```

**❌ 错误写法：**
```ts
// 不要在组件内直接调用 client
function Home() {
  useEffect(() => {
    client.GET('/api/users/').then(({ data }) => setUsers(data))
  }, [])
}

// 不要直接 throw error 对象（与统一响应协议不兼容）
fetchUsers: async () => {
  const { data, error } = await client.GET('/api/users/')
  if (error)
    throw error  // 应改为 throw new Error(getApiErrorMessage(error))
},

// 不要手动访问 data.data（类型不安全，应用 unwrapApiResponse）
fetchUsers: async () => {
  const { data } = await client.GET('/api/users/')
  set({ users: data?.data ?? [] })  // 应改为 unwrapApiResponse((data as UserListEnvelope))
},

// 不要忽略 error（静默失败）
fetchUsers: async () => {
  const { data } = await client.GET('/api/users/')
  if (data)
    set({ users: data })
  // error 被忽略，set loading 也被忽略
},

// 不要在 action 外部 set loading（违背封装）
function Home() {
  const { fetchUsers } = useUsersStore()
  const handleLoad = async () => {
    setLoading(true)        // 不要在组件里操作 store state
    await fetchUsers()
    setLoading(false)
  }
}
```

---

### 组件内消费 Store

在组件顶层解构所需字段，不传整个 store 对象。

**✅ 正确写法：**
```ts
// 来自 src/pages/Home.tsx
const { users, loading, fetchUsers, addUser } = useUsersStore()

// 只取需要的字段
const { count, increment } = useCounterStore()

// 只取 action
const { fetchUsers } = useUsersStore()
```

**❌ 错误写法：**
```ts
// 接收整个 store 对象
const store = useUsersStore()
store.fetchUsers()

// 将 store 作为 prop 传递给子组件
function Parent() {
  const store = useUsersStore()
  return <Child store={store} />
}

// 在子组件内通过 prop 接收 store 数据（应直接在子组件内调用 hook）
function Child({ users }: { users: User[] }) { ... }
```

---

### Store barrel 导出

所有 store 通过 `store/index.ts` 统一导出，组件从 barrel 路径导入。

**✅ 正确写法：**
```ts
// store/index.ts
export { useCounterStore } from './counter'
export { createStore } from './createStore'
export { useUsersStore } from './users'

// 组件中导入
import { useUsersStore } from '../store'
```

**❌ 错误写法：**
```ts
// 跳过 barrel，直接从文件导入
import { useUsersStore } from '../store/users'

// 导入 createStore 时从具体文件导入
import { createStore } from '../store/createStore'

// 新建 store 后忘记在 index.ts 中导出
// store/posts.ts 已创建，但 store/index.ts 未导出
```
