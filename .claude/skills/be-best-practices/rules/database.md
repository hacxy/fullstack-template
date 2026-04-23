# 数据库规范

> 基于 `src/db/index.ts`、`src/db/schema.ts`、`drizzle.config.ts`、`src/index.ts` 4 个文件分析得出。

## 概述

Drizzle ORM + bun:sqlite，schema 定义在 `src/db/schema.ts`，类型通过 `$inferSelect`/`$inferInsert` 推断，migration 在启动时自动运行。

## 规则

### 表定义格式

使用 `sqliteTable` 定义表，字段用 drizzle-orm/sqlite-core 的类型函数（`int`、`text` 等），默认值用 `$defaultFn`。

**✅ 正确写法：**
```ts
// 来自 src/db/schema.ts
export const users = sqliteTable('User', {
  id: int('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: int('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// 有外键关联的表
export const posts = sqliteTable('Post', {
  id: int('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  authorId: int('authorId').notNull().references(() => users.id),
  createdAt: int('createdAt', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

// 可选字段
export const profiles = sqliteTable('Profile', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('userId').notNull().references(() => users.id),
  bio: text('bio'),  // 可 null
})
```

**❌ 错误写法：**
```ts
// 不要用原始 SQL 字符串创建表
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY...)')

// 不要在 schema 外部手写类型，应用 $inferSelect
interface User {
  id: number
  name: string
  createdAt: Date
}

// 不要把表名用 camelCase（项目中表名用 PascalCase）
export const users = sqliteTable('users', { ... })  // 应为 'User'
```

---

### 类型推断（禁止手写重复类型）

在 schema 文件中直接用 `$inferSelect` / `$inferInsert` 导出 TypeScript 类型。

**✅ 正确写法：**
```ts
// 来自 src/db/schema.ts
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

// 其他表同样处理
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert

// 在 service 中使用推断类型
import type { User } from '../db/schema.js'
static async findById(id: number): Promise<User | null> { ... }
```

**❌ 错误写法：**
```ts
// 不要手写与 schema 重复的类型
interface User {
  id: number
  name: string
  createdAt: Date
}

// 不要用 any 绕过类型
const rows: any[] = await db.select().from(users)

// 不要在 service 里重新定义返回类型
type UserRecord = { id: number; name: string }  // 与 $inferSelect 重复
```

---

### 查询写法

使用 Drizzle 的链式 query builder，不写原始 SQL。

**✅ 正确写法：**
```ts
// SELECT all
db.select().from(users)

// INSERT + returning（来自 src/services/userService.ts）
const rows = await db.insert(users).values(data).returning()
return rows[0]

// SELECT with WHERE（使用 drizzle-orm 辅助函数）
import { eq } from 'drizzle-orm'
db.select().from(users).where(eq(users.id, id))
```

**❌ 错误写法：**
```ts
// 不要写原始 SQL
db.run('SELECT * FROM User WHERE id = ?', [id])

// 不要用字符串拼接 SQL
const query = `SELECT * FROM User WHERE name = '${name}'`  // SQL 注入风险

// 不要用 bun:sqlite 直接查询（应通过 drizzle 实例）
sqlite.query('SELECT * FROM User').all()
```

---

### db 客户端初始化

在 `src/db/index.ts` 中创建唯一实例，启用 WAL 模式，导出 `db`。

**✅ 正确写法：**
```ts
// 来自 src/db/index.ts
const dbPath = (process.env.DATABASE_URL ?? 'file:./sqlite.db').replace(/^file:/, '')
const sqlite = new Database(dbPath)
sqlite.run('PRAGMA journal_mode=WAL;')
export const db = drizzle(sqlite, { schema })
```

**❌ 错误写法：**
```ts
// 不要在多处各自创建 db 实例
// services/userService.ts
const sqlite = new Database('./sqlite.db')
const db = drizzle(sqlite)

// 不要硬编码路径，忽略环境变量
const sqlite = new Database('./sqlite.db')  // 应读 DATABASE_URL

// 不要跳过 WAL 模式（会影响并发性能）
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })  // 缺少 PRAGMA journal_mode=WAL
```
