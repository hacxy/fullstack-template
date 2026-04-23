# TypeScript 规范

> 基于 `tsconfig.json`、`src/controllers/userController.ts`、`src/services/userService.ts`、`src/db/schema.ts`、`src/index.ts` 5 个文件分析得出。

## 概述

`strict: true` 全量严格模式，`moduleResolution: nodenext` 要求本地导入带 `.js` 扩展名，`@/*` 别名指向 `src/*`，类型从 Drizzle schema 推断而非手写。

## 规则

### 本地导入必须带 .js 扩展名

`moduleResolution: nodenext` 模式下，所有本地相对路径导入必须加 `.js` 后缀。

**✅ 正确写法：**
```ts
// 来自 src/controllers/userController.ts
import { UserModel } from '../models/userModel.js'
import { UserService } from '../services/userService.js'

// 来自 src/index.ts
import { app } from './app.js'
import { db } from './db/index.js'

// 来自 src/services/userService.ts
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
```

**❌ 错误写法：**
```ts
// 缺少扩展名
import { UserModel } from '../models/userModel'
import { UserService } from '../services/userService'

// 使用 .ts 扩展名（应为 .js）
import { db } from '../db/index.ts'

// 多个文件都缺少 .js
import { app } from './app'
import { db } from './db/index'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'  // 第三方包不需要 .js，这行本身是对的
```

---

### node: 协议导入内置模块

Node.js / Bun 内置模块使用 `node:` 前缀。

**✅ 正确写法：**
```ts
// 来自 src/index.ts
import path from 'node:path'
import process from 'node:process'

// 来自 scripts/generateApi.ts
import * as fs from 'node:fs'
import * as path from 'node:path'
import process from 'node:process'
```

**❌ 错误写法：**
```ts
// 缺少 node: 前缀
import path from 'path'
import process from 'process'
import fs from 'fs'
```

---

### 类型来源优先级

从 Drizzle `$inferSelect`/`$inferInsert` 推断，不手写重复类型。

**✅ 正确写法：**
```ts
// 来自 src/db/schema.ts — 从 schema 推断
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// service 返回值类型自动推断，无需手动标注
static findAll() {
  return db.select().from(users)  // 返回类型自动推断为 User[]
}

// 需要显式标注时引用推断类型
static async findById(id: number): Promise<User | null> {
  const rows = await db.select().from(users).where(eq(users.id, id))
  return rows[0] ?? null
}
```

**❌ 错误写法：**
```ts
// 手写与 schema 重复的类型
interface User {
  id: number
  name: string
  createdAt: Date
}

// 用 any 绕过类型检查
static async findAll(): Promise<any[]> {
  return db.select().from(users)
}

// 强制类型断言代替正确类型
const user = rows[0] as User
```

---

### @/* 路径别名（可选使用）

tsconfig 已配置 `"@/*": ["./src/*"]`，可用于避免深层 `../../` 路径，但当前代码统一使用相对路径，新代码保持与已有代码一致即可。

**✅ 两种方式均可接受：**
```ts
// 相对路径（当前项目的做法）
import { db } from '../db/index.js'

// 别名（可选，适合深层嵌套时）
import { db } from '@/db/index.js'
```

**❌ 错误写法：**
```ts
// 不要混用（同一文件内保持一致）
import { db } from '../db/index.js'
import { users } from '@/db/schema.js'

// 不要使用不存在的别名
import { db } from '~/db/index.js'      // 项目无 ~ 别名
import { db } from '#db/index.js'       // 项目无 # 别名
```
