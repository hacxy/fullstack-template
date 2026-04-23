# Service 规范

> 基于 `src/services/userService.ts` 1 个文件分析得出。

## 概述

Service 层使用带 `static` 方法的类，直接调用 Drizzle db 实例执行查询，不实例化，不注入依赖。

## 规则

### Service 文件命名

`camelCase`，格式为 `{domain}Service.ts`。

**✅ 正确写法：**
```
services/userService.ts
services/postService.ts
services/authService.ts
```

**❌ 错误写法：**
```
services/UserService.ts    // PascalCase
services/user-service.ts   // kebab-case
services/user.ts           // 缺少 Service 后缀
```

---

### 使用 Static 类方法

Service 是纯静态类，所有方法用 `static` 声明，调用方使用 `ClassName.method()` 不 `new`。

**✅ 正确写法：**
```ts
// 来自 src/services/userService.ts
export class UserService {
  static findAll() {
    return db.select().from(users)
  }

  static async create(data: { name: string }) {
    const rows = await db.insert(users).values(data).returning()
    return rows[0]
  }

  static async findById(id: number) {
    const rows = await db.select().from(users).where(eq(users.id, id))
    return rows[0] ?? null
  }
}
```

**❌ 错误写法：**
```ts
// 不要实例化 service
export class UserService {
  constructor(private db: DrizzleDB) {}
  findAll() { ... }
}

// 不要导出独立函数（应统一用 static class）
export function findAllUsers() {
  return db.select().from(users)
}

// 不要在 controller 里直接写 db 查询
export const userController = new Elysia({ prefix: '/api/users' })
  .get('/', () => db.select().from(users), { ... })
```

---

### 直接导入 db 和 schema

Service 直接从 `../db/index.js` 导入 `db`，从 `../db/schema.js` 导入表定义，不通过构造函数注入。

**✅ 正确写法：**
```ts
// 来自 src/services/userService.ts
import { db } from '../db/index.js'
import { users } from '../db/schema.js'

// 导入多个表
import { db } from '../db/index.js'
import { posts, users } from '../db/schema.js'

// 导入 drizzle 辅助函数
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
```

**❌ 错误写法：**
```ts
// 缺少 .js 扩展名（nodenext 要求必须有）
import { db } from '../db/index'
import { users } from '../db/schema'

// 不要使用路径别名导入 db（保持相对路径一致性）
import { db } from '@/db/index.js'

// 不要在 service 中直接创建新的 db 连接
const sqlite = new Database('./sqlite.db')
const db = drizzle(sqlite)
```

---

### insert 使用 .returning()

写入操作使用 `.returning()` 获取插入后的完整记录，取第一个元素返回。

**✅ 正确写法：**
```ts
// 来自 src/services/userService.ts
static async create(data: { name: string }) {
  const rows = await db.insert(users).values(data).returning()
  return rows[0]
}

// 更新操作同样使用 .returning()
static async update(id: number, data: { name: string }) {
  const rows = await db.update(users).set(data).where(eq(users.id, id)).returning()
  return rows[0] ?? null
}

// 删除并返回被删除的记录
static async delete(id: number) {
  const rows = await db.delete(users).where(eq(users.id, id)).returning()
  return rows[0] ?? null
}
```

**❌ 错误写法：**
```ts
// 不要 insert 后再单独 select
static async create(data: { name: string }) {
  await db.insert(users).values(data)
  return db.select().from(users).where(eq(users.name, data.name))
}

// 不要忽略 .returning() 直接返回 void
static async create(data: { name: string }) {
  await db.insert(users).values(data)
  // 无返回值
}

// 不要直接返回 rows 数组，应取 rows[0]
static async create(data: { name: string }) {
  return db.insert(users).values(data).returning()  // 返回数组而非单个对象
}
```
