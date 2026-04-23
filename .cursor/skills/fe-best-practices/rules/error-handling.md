# 错误处理规范

> 基于 `src/store/users.ts`、`src/pages/Home.tsx` 2 个文件分析得出。当前代码样本较少，Error Boundary 和 Toast 部分为推断。

## 概述

API 错误在 store action 内 throw，组件通过 store 的 `loading` 状态控制 UI，无全局 Error Boundary 和 Toast 库（当前版本）。

## 规则

### API 错误处理

在 store action 内，检查 openapi-fetch 返回的 `error` 字段，直接 throw，不静默吞掉。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts — fetch 操作
fetchUsers: async () => {
  set({ loading: true })
  const { data, error } = await client.GET('/api/users/')
  if (error)
    throw error
  set({ users: data, loading: false })
},

// POST 操作
addUser: async (name) => {
  const { data, error } = await client.POST('/api/users/', { body: { name } })
  if (error)
    throw error
  set(state => ({ users: [...state.users, data] }))
},

// DELETE 操作（示例）
deleteUser: async (id) => {
  const { error } = await client.DELETE('/api/users/{id}', { params: { path: { id } } })
  if (error)
    throw error
  set(state => ({ users: state.users.filter(u => u.id !== id) }))
},
```

**❌ 错误写法：**
```ts
// 静默忽略 error
fetchUsers: async () => {
  const { data } = await client.GET('/api/users/')
  set({ users: data ?? [] })  // error 被忽略，data 可能 undefined

// 吞掉 error 并 console
addUser: async (name) => {
  const { data, error } = await client.POST('/api/users/', { body: { name } })
  if (error) {
    console.error(error)  // 仅打印，不 throw，组件无法感知
    return
  }
  set(state => ({ users: [...state.users, data!] }))
}

// 不检查 error，直接使用 data（可能 undefined）
fetchUsers: async () => {
  const { data } = await client.GET('/api/users/')
  set({ users: data, loading: false })  // data 可能 undefined
},
```

---

### Loading 状态管理

在 store interface 中定义 `loading: boolean` 字段，action 开始时设为 `true`，成功后恢复。

**✅ 正确写法：**
```ts
// store interface 中声明
interface UsersStore {
  users: User[]
  loading: boolean     // 在 interface 中声明
  fetchUsers: () => Promise<void>
}

// action 内设置 loading
fetchUsers: async () => {
  set({ loading: true })
  const { data, error } = await client.GET('/api/users/')
  if (error) throw error
  set({ users: data, loading: false })
},

// 组件通过 loading 控制 UI
const { users, loading } = useUsersStore()
// { loading ? <p>Loading...</p> : ... }
```

**❌ 错误写法：**
```ts
// 在组件内用独立 useState 管理 loading（应在 store）
function Home() {
  const [loading, setLoading] = useState(false)
  const { fetchUsers } = useUsersStore()
  useEffect(() => {
    setLoading(true)
    fetchUsers().finally(() => setLoading(false))
  }, [])
}

// 不管理 loading（没有加载态）
fetchUsers: async () => {
  const { data, error } = await client.GET('/api/users/')
  if (error) throw error
  set({ users: data })  // 缺少 loading 状态切换
},

// loading 只设为 true，不在成功/失败后重置
fetchUsers: async () => {
  set({ loading: true })
  const { data, error } = await client.GET('/api/users/')
  if (error) throw error
  set({ users: data })  // 忘记 set({ loading: false })
},
```

---

### 三态 UI 模式

按 loading → empty → content 顺序做条件渲染，使用嵌套三元表达式。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
{loading
  ? <p style={{ color: '#888' }}>Loading...</p>
  : users.length === 0
    ? <p style={{ color: '#888' }}>No users yet. Add one above.</p>
    : (
        <ul>
          {users.map(user => (...))}
        </ul>
      )}

// 提交按钮三态
<button disabled={submitting || !name.trim()}>
  {submitting ? 'Adding...' : 'Add user'}
</button>

// 简单二态
{loading ? <p>Loading...</p> : <Content />}
```

**❌ 错误写法：**
```tsx
// 用 && 渲染数字（users.length = 0 时渲染 "0"）
{users.length && <ul>...</ul>}

// 没有 loading 态（直接渲染 empty 或 content）
{users.length === 0
  ? <p>No users.</p>
  : <ul>...</ul>}
// 缺少 loading 状态处理

// 用多个 return 提前返回（项目不使用此模式）
if (loading) return <p>Loading...</p>
if (users.length === 0) return <p>No users.</p>
return <ul>...</ul>
```

---

### 提交状态管理

提交型操作（POST/PUT/DELETE）在组件内用独立 `submitting` state 跟踪，与 store 的 `loading` 分开。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
const [submitting, setSubmitting] = useState(false)

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!name.trim()) return
  setSubmitting(true)
  await addUser(name.trim())
  setName('')
  setSubmitting(false)
}

<button type="submit" disabled={submitting || !name.trim()}>
  {submitting ? 'Adding...' : 'Add user'}
</button>
```

**❌ 错误写法：**
```tsx
// 复用 store 的 loading 字段控制提交按钮（语义混乱）
const { loading, addUser } = useUsersStore()
<button disabled={loading}>Add user</button>  // loading 是 fetchUsers 的状态

// 提交时不禁用按钮（允许重复提交）
<button onClick={handleSubmit}>Add user</button>  // 没有 disabled

// 提交完成后不重置 submitting（按钮永久禁用）
async function handleSubmit() {
  setSubmitting(true)
  await addUser(name)
  // 忘记 setSubmitting(false)
}
```
