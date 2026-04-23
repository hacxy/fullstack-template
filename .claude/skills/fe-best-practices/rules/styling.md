# 样式规范

> 基于 `src/layouts/RootLayout.tsx`、`src/layouts/RootLayout.css`、`src/pages/Home.tsx`、`src/index.css`、`src/App.css` 5 个文件分析得出。

## 概述

纯 CSS 方案，无 Tailwind、无 CSS-in-JS、无组件库。组件配套 CSS 文件（PascalCase 同名），一次性布局使用行内样式。

## 规则

### 组件配套 CSS 文件

有独立样式需求的组件，在同目录创建同名 CSS 文件（PascalCase），组件内顶层导入。

**✅ 正确写法：**
```
// 文件结构
layouts/
  RootLayout.tsx
  RootLayout.css

// 组件内导入（来自 src/layouts/RootLayout.tsx）
import './RootLayout.css'
function RootLayout() { ... }

// 另一个例子
pages/
  Home.tsx
  Home.css   ← 若 Home 有独立样式需求
```

**❌ 错误写法：**
```
// 用 CSS Modules（项目不使用）
import styles from './RootLayout.module.css'
<nav className={styles.nav}>

// 文件名不匹配组件名
RootLayout.tsx
layout.css      // 应为 RootLayout.css

// CSS 文件放在不同目录
styles/
  RootLayout.css  // 应与组件同目录
```

---

### 全局 CSS 文件

- `src/index.css`：全局重置和 CSS 变量，在 `main.tsx` 中导入
- `src/App.css`：跨组件共享的 UI 类，在使用处按需导入

**✅ 正确写法：**
```tsx
// main.tsx — 全局样式在入口导入
import './index.css'
createRoot(document.getElementById('root')!).render(...)

// 组件内按需导入 App.css
import '../App.css'
function Home() {
  return <button className="counter">Click me</button>
}

// 全局样式只在 main.tsx 导入一次，不在每个组件里重复导入
```

**❌ 错误写法：**
```tsx
// 在 App.tsx 导入全局样式（应在 main.tsx）
// App.tsx
import './index.css'  // 应移到 main.tsx

// 每个组件都重复导入 index.css
// Home.tsx
import '../index.css'  // 已在 main.tsx 导入，不要重复

// 创建专门的样式汇总文件（unnecessary abstraction）
// styles/index.ts
export * from './App.css'
export * from './index.css'
```

---

### 行内样式

一次性、不复用的布局样式（间距、flex、颜色微调）直接写行内 style，不为此创建 CSS 类。

**✅ 正确写法：**
```tsx
// 来自 src/pages/Home.tsx
<form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>

<input style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #444', background: '#1a1a1a', color: 'inherit', fontSize: '1em' }} />

<li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #333' }}>
```

**❌ 错误写法：**
```tsx
// 为一次性样式创建 CSS 类（过度抽象）
// Home.css
.form-container { display: flex; gap: 8px; }
// Home.tsx
<form className="form-container">

// 用 styled-components（项目未安装）
const StyledForm = styled.form`display: flex; gap: 8px;`

// 用 tailwind 类（项目未安装）
<form className="flex gap-2">
```

---

### 无 className 合并工具

项目未引入 `clsx`、`classnames` 或 `cn` 工具函数，多个 className 用字符串拼接。

**✅ 正确写法：**
```tsx
// 单个 className
<button className="counter">Click me</button>

// 条件样式用三元（直接字符串）
<button className={isActive ? 'btn btn-active' : 'btn'}>

// 无 className 时用行内 style
<p style={{ color: '#888' }}>Loading...</p>
```

**❌ 错误写法：**
```tsx
// 引入 clsx（未安装）
import clsx from 'clsx'
<button className={clsx('btn', { active: isActive })}>

// 引入 cn 工具（项目无此文件）
import { cn } from '@/lib/utils'
<div className={cn('base', conditional && 'extra')}>

// 引入 classnames（未安装）
import classNames from 'classnames'
<button className={classNames('btn', { 'btn-active': isActive })}>
```
