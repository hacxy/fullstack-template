# 组件规范

> 基于 `src/pages/Home.tsx`、`src/pages/About.tsx`、`src/pages/NotFound.tsx`、`src/layouts/RootLayout.tsx`、`src/App.tsx` 5 个文件分析得出。

## 概述

所有组件使用 `function` 声明式写法，默认导出，无路径别名，相对路径导入。

## 规则

### 函数声明方式

使用 `function ComponentName()` 声明，不使用箭头函数。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
function Home() {
  return (...)
}
export default Home

// 来自 src/layouts/RootLayout.tsx
function RootLayout() {
  return (...)
}
export default RootLayout

// 页面组件
function About() {
  return (...)
}
export default About
```

**❌ 错误写法：**
```tsx
// 箭头函数组件
const Home = () => { return (...) }
export default Home

// 箭头函数 + 直接导出
export default () => { return (...) }

// React.FC 类型标注（项目无此用法）
const Home: React.FC = () => { return (...) }
```

---

### 导出方式

统一使用默认导出，不使用具名导出。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
function Home() { ... }
export default Home

// 来自 src/pages/NotFound.tsx
function NotFound() { ... }
export default NotFound

// 来自 src/layouts/RootLayout.tsx
function RootLayout() { ... }
export default RootLayout
```

**❌ 错误写法：**
```tsx
// 具名导出组件
export function Home() { ... }

// 内联默认导出函数（无法被 React DevTools 识别组件名）
export default function() { return (...) }

// 既默认又具名
export const Home = function() { ... }
export default Home
```

---

### 文件内结构顺序

`import` → 组件函数体（state/store → effects → handlers → return JSX）→ `export default`

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
import { useEffect, useState } from 'react'
import viteLogo from '../assets/vite.svg'
import { useUsersStore } from '../store'
import '../App.css'

function Home() {
  // 1. store & state
  const { users, loading, fetchUsers, addUser } = useUsersStore()
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 2. effects
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // 3. handlers
  async function handleSubmit(e: React.FormEvent) {
    // ...
  }

  // 4. return JSX
  return (...)
}

export default Home
```

**❌ 错误写法：**
```tsx
// handler 定义在 return 之后（不可能，但常见于组件外部定义）
function Home() {
  return (<button onClick={handleClick}>...</button>)
}
function handleClick() { ... }  // 定义在组件外

// import 顺序混乱（CSS 与模块混排）
import '../App.css'
import { useEffect } from 'react'
import { useUsersStore } from '../store'
import viteLogo from '../assets/vite.svg'

// 将 export default 放在 function 声明的同一行
export default function Home() { ... }  // 项目不用此写法
```

---

### 条件渲染

loading / empty / content 三态使用嵌套三元表达式，不拆成多个 `if` return。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx — 三态嵌套三元
{loading
  ? <p style={{ color: '#888' }}>Loading...</p>
  : users.length === 0
    ? <p style={{ color: '#888' }}>No users yet. Add one above.</p>
    : (
        <ul>
          {users.map(user => (...))}
        </ul>
      )}

// 二态：布尔显隐
{submitting ? 'Adding...' : 'Add user'}

// 按钮禁用
<button type="submit" disabled={submitting || !name.trim()}>
```

**❌ 错误写法：**
```tsx
// 提前 return（项目无此模式）
if (loading) return <p>Loading...</p>
if (users.length === 0) return <p>No users.</p>
return <ul>...</ul>

// 用 && 渲染数字（可能渲染 "0"）
{users.length && <ul>...</ul>}  // 当 users.length=0 时会渲染 "0"

// 用独立 state 变量控制 UI 而非从 store 状态派生
const [isEmpty, setIsEmpty] = useState(false)  // 应直接用 users.length === 0
```

---

### 内联 Handler

事件处理函数在组件函数体内用 `function` 声明，不用箭头函数。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!name.trim())
    return
  setSubmitting(true)
  await addUser(name.trim())
  setName('')
  setSubmitting(false)
}

// 简单事件直接内联箭头函数（行内简短操作可以）
<input onChange={e => setName(e.target.value)} />
```

**❌ 错误写法：**
```tsx
// handler 用箭头函数赋值给变量
const handleSubmit = async (e: React.FormEvent) => {
  // ...
}

// handler 定义在组件外部
function handleSubmit(e, setSubmitting, addUser) { ... }
function Home() {
  return <form onSubmit={e => handleSubmit(e, setSubmitting, addUser)} />
}

// handler 直接写在 JSX prop 里（复杂逻辑不内联）
<form onSubmit={async (e) => {
  e.preventDefault()
  setSubmitting(true)
  await addUser(name.trim())
  setSubmitting(false)
}} />
```
