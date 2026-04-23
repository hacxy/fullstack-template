# 路由规范

> 基于 `src/router/index.tsx`、`src/App.tsx`、`src/layouts/RootLayout.tsx`、`src/pages/NotFound.tsx` 4 个文件分析得出。

## 概述

React Router 7，配置式路由（createBrowserRouter），所有路由定义集中在 `src/router/index.tsx`，根布局通过嵌套 children 组织。

## 规则

### 路由配置集中管理

所有路由定义在 `src/router/index.tsx`，导出一个 `router` 常量（默认导出）。

**✅ 正确写法：**
```tsx
// 来自 src/router/index.tsx
import { createBrowserRouter } from 'react-router'
import RootLayout from '../layouts/RootLayout'
import About from '../pages/About'
import Home from '../pages/Home'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])

export default router

// 新增路由时也在同一文件追加
import Dashboard from '../pages/Dashboard'
children: [
  { index: true, element: <Home /> },
  { path: 'about', element: <About /> },
  { path: 'dashboard', element: <Dashboard /> },  // 追加
]
```

**❌ 错误写法：**
```tsx
// 路由分散在各组件文件
// Home.tsx
export const homeRoute = { path: '/', element: <Home /> }

// 在 App.tsx 内联路由配置
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}

// 具名导出 router（应默认导出）
export const router = createBrowserRouter([...])
```

---

### Layout 通过 children 嵌套

根布局作为父路由 `element`，子页面用 `children` 数组，布局内用 `<Outlet />` 渲染子页面。

**✅ 正确写法：**
```tsx
// router/index.tsx — layout 作为父路由
{
  path: '/',
  element: <RootLayout />,
  children: [
    { index: true, element: <Home /> },
    { path: 'about', element: <About /> },
  ],
}

// layouts/RootLayout.tsx — 用 Outlet 渲染子页面
import { NavLink, Outlet } from 'react-router'
function RootLayout() {
  return (
    <>
      <nav><NavLink to="/">Home</NavLink></nav>
      <Outlet />
    </>
  )
}

// 多层嵌套 layout（示例）
{
  path: '/dashboard',
  element: <DashboardLayout />,
  children: [
    { index: true, element: <Overview /> },
    { path: 'settings', element: <Settings /> },
  ],
}
```

**❌ 错误写法：**
```tsx
// 用 children prop 传递（旧版 React Router 写法）
<Route path="/" element={<RootLayout><Home /></RootLayout>} />

// Layout 内不用 Outlet，手动渲染 children prop
function RootLayout({ children }: { children: React.ReactNode }) {
  return <><nav>...</nav>{children}</>
}

// 路由配置中不使用 index，用具体 path='/' 代替
children: [
  { path: '/', element: <Home /> },  // 应用 index: true
]
```

---

### 404 捕获路由

通配路由 `path: '*'` 放在路由数组末尾，不在 RootLayout 的 children 内。

**✅ 正确写法：**
```tsx
// 来自 src/router/index.tsx — 末尾独立配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [...],
  },
  {
    path: '*',
    element: <NotFound />,  // 独立，不在 children 内
  },
])

// NotFound 组件提供回首页链接
function NotFound() {
  return (
    <section>
      <h1>404</h1>
      <Link to="/">Back to Home</Link>
    </section>
  )
}
```

**❌ 错误写法：**
```tsx
// 把 404 放在 children 内（会继承 RootLayout 样式，可能不符合预期）
{
  path: '/',
  element: <RootLayout />,
  children: [
    { index: true, element: <Home /> },
    { path: '*', element: <NotFound /> },  // 应在 children 外
  ],
}

// 没有 404 路由（未处理未知路径）
const router = createBrowserRouter([
  { path: '/', element: <RootLayout />, children: [...] },
  // 缺少 { path: '*', element: <NotFound /> }
])

// 用 Navigate 重定向替代 404（丢失用户意图）
{ path: '*', element: <Navigate to="/" replace /> }
```

---

### 导航组件选择

- 导航栏链接用 `NavLink`（自动 active 类）
- 普通内容链接用 `Link`

**✅ 正确写法：**
```tsx
// 导航栏 — 来自 src/layouts/RootLayout.tsx
<NavLink to="/" end>Home</NavLink>
<NavLink to="/about">About</NavLink>

// 内容链接 — 来自 src/pages/NotFound.tsx
<Link to="/">Back to Home</Link>

// NavLink 的 end 属性防止 / 路径全局激活
<NavLink to="/" end>Home</NavLink>  // end 确保只在精确匹配 / 时激活
```

**❌ 错误写法：**
```tsx
// 用原生 <a> 标签做内部跳转（会触发全页面刷新）
<a href="/about">About</a>

// 导航栏用 Link 代替 NavLink（丢失 active 状态）
<Link to="/">Home</Link>
<Link to="/about">About</Link>

// NavLink 在根路径不加 end（会导致所有页面都激活首页链接）
<NavLink to="/">Home</NavLink>  // 缺少 end
```
