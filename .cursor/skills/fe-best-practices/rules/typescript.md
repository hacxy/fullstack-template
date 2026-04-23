# TypeScript 规范

> 基于 `src/store/counter.ts`、`src/store/users.ts`、`src/store/createStore.ts`、`src/services/client.ts`、`tsconfig.app.json` 5 个文件分析得出。

## 概述

严格类 TypeScript 配置（verbatimModuleSyntax、erasableSyntaxOnly、noUnusedLocals），`interface` 用于 store 形状定义，`type` 用于 API schema 类型提取，无路径别名。

## 规则

### import type 强制要求

`verbatimModuleSyntax` 已开启，纯类型导入必须使用 `import type`。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts
import type { components } from '../services'
import { client } from '../services'

// 来自 src/store/createStore.ts
import type { StateCreator } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 类型和值混合时分开导入
import type { User } from '../db/schema.js'
import { users } from '../db/schema.js'
```

**❌ 错误写法：**
```ts
// 值和类型混合导入（violates verbatimModuleSyntax）
import { components, client } from '../services'  // components 是类型，缺少 type

// 只有类型却不用 import type
import { StateCreator } from 'zustand'

// 整体导入但只用了类型
import * as Services from '../services'
const x: Services.components = ...  // 应用 import type
```

---

### interface vs type 使用区分

- `interface`：定义对象形状（store 的 state + actions）
- `type`：从生成文件提取 API 实体类型、创建类型别名

**✅ 正确写法：**
```ts
// interface — 来自 src/store/counter.ts（store 形状）
interface CounterStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

// interface — 来自 src/store/users.ts（store 形状）
interface UsersStore {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
  addUser: (name: string) => Promise<void>
}

// type — 来自 src/store/users.ts（API schema 类型提取）
type User = components['schemas']['user.item']
```

**❌ 错误写法：**
```ts
// 用 type 定义 store 形状（项目用 interface）
type CounterStore = {
  count: number
  increment: () => void
}

// 用 interface 声明 API 类型别名
interface User extends components['schemas']['user.item'] {}  // 无意义的 extends

// 手写与 schema 等效的类型
interface User {
  id: number
  name: string
}  // 与 components['schemas']['user.item'] 重复
```

---

### API 类型引用

API 实体类型通过 `components['schemas']['domain.purpose']` 索引签名提取，不手写等效类型。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts
type User = components['schemas']['user.item']

// 多个类型提取
type UserCreate = components['schemas']['user.create']
type UserList = components['schemas']['user.list']

// 直接用于函数参数类型
async function addUser(data: components['schemas']['user.create']) { ... }
```

**❌ 错误写法：**
```ts
// 手写重复类型
interface User {
  id: number
  name: string
}

// 用 any 绕过类型
const users: any[] = []

// 用类型断言代替正确类型提取
const user = data as { id: number; name: string }
```

---

### 无路径别名

项目未配置 `@/` 别名，使用相对路径导入。

**✅ 正确写法：**
```ts
// 来自 src/store/users.ts
import type { components } from '../services'
import { client } from '../services'
import { createStore } from './createStore'

// 来自 src/pages/Home.tsx
import { useUsersStore } from '../store'
import '../App.css'
```

**❌ 错误写法：**
```ts
// 使用不存在的 @/ 别名
import { useUsersStore } from '@/store'
import { client } from '@/services'

// 使用 ~/ 别名
import { useUsersStore } from '~/store'

// 使用绝对路径
import { useUsersStore } from '/src/store'
```

---

### 禁止使用的 TypeScript 特性

`erasableSyntaxOnly: true` 禁止 decorator 和 `enum`，用对象常量代替 enum。

**✅ 正确写法：**
```ts
// const 对象 + 类型提取（代替 enum）
const Status = { Active: 'active', Inactive: 'inactive' } as const
type Status = typeof Status[keyof typeof Status]

// const 对象映射
const RouteMap = { Home: '/', About: '/about' } as const

// 字面量联合类型
type Theme = 'light' | 'dark'
```

**❌ 错误写法：**
```ts
// 数字 enum
enum Status { Active, Inactive }

// 字符串 enum
enum Theme { Light = 'light', Dark = 'dark' }

// const enum
const enum Direction { Up, Down, Left, Right }
```
