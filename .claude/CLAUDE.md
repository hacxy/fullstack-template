# Project Conventions

## Commands

| 命令 | 说明 |
|------|------|
| `bun run dev` | 启动全部开发服务器（前后端） |
| `bun run build` | 构建全部应用 |
| `bun run test` | 运行全部测试（Web E2E + Server 单元测试） |
| `bun run lint` | 检查全部代码 |
| `bun run lint:fix` | 自动修复可修复的 lint 问题 |
| `bun run codegen:api` | 从后端 OpenAPI spec 生成前端类型，更新 `apps/web/src/services/schema.gen.ts` |
| `bun run db:migrate` | 运行 Drizzle 数据库迁移 |
| `bun run db:studio` | 打开 Drizzle Studio |

## Stack

- **Monorepo**: Bun workspaces (`apps/*`, `packages/*`)
- **Backend** (`apps/server`): Bun + Elysia 1.4.28 + Drizzle ORM 0.45.2 + SQLite (bun:sqlite) + elysia-plugin-response (workspace)
- **Frontend** (`apps/web`): React 19.2.5 + Vite 8.0.9 + React Router 7.14.1 + Zustand 5.0.12 + openapi-fetch 0.17.0
- **Shared** (`packages/shared`): Cross-app types and utilities
- **Linting**: `@antfu/eslint-config` with `lint-staged` + `commitlint` git hooks
- **Testing**: Playwright 1.59.1 (E2E) + nyc + vite-plugin-istanbul (coverage)
- **Package manager**: pnpm

## File & Directory Naming

**Frontend (`apps/web`)**

| Category | Convention | Examples |
|----------|------------|---------|
| Directories | kebab-case | `pages/`, `layouts/`, `store/`, `router/`, `assets/` |
| React component files | PascalCase | `Home.tsx`, `RootLayout.tsx`, `NotFound.tsx` |
| Component-paired CSS | PascalCase, same name as component | `RootLayout.css` |
| Non-component TS/TSX files | camelCase | `main.tsx`, `counter.ts`, `index.ts`, `createStore.ts` |
| Global CSS | camelCase | `index.css`, `App.css` |
| Static assets | kebab-case | `hero.png`, `react.svg` |

**Backend (`apps/server`)**

| Category | Convention | Examples |
|----------|------------|---------|
| Directories | camelCase | `db/`, `models/`, `controllers/`, `services/` |
| Source files | camelCase with domain prefix | `userController.ts`, `userService.ts`, `userModel.ts` |
| DB files | camelCase | `index.ts`, `schema.ts` |
| Config files | camelCase or framework convention | `drizzle.config.ts`, `eslint.config.js` |
| Test files | same name as source + `.test.ts` | `userController.test.ts`, `userService.test.ts` |

## Project Structure

```
apps/
  server/          # Elysia API server
    drizzle/       # Drizzle migration SQL files
    tests/         # bun:test unit & integration tests (mirrors src/ structure)
    src/
      db/          # Drizzle client + schema (table definitions + inferred types)
      models/      # Elysia TypeBox models (namespace.purpose key convention, e.g. user.create)
      controllers/ # Elysia route handlers (thin layer: prefix + model + service delegation)
      services/    # Business logic (static class methods)
      app.ts       # Elysia app assembly (cors + swagger + controllers)
      index.ts     # Server entry point (migration runner + app.listen)
  web/             # React frontend
    e2e/           # Playwright E2E tests
    public/        # Static assets
    src/
      assets/      # Images and SVGs
      layouts/     # Layout components
      pages/       # Page components
      router/      # React Router config
      store/       # Zustand stores
      services/    # openapi-fetch client + auto-generated schema types
      App.tsx
      main.tsx
packages/
  shared/          # Shared types (e.g., ApiResponse<T>)
```

## Environment Variables

**Frontend (`apps/web/.env.example`)**

| 变量名 | 用途 |
|--------|------|
| `VITE_API_URL` | 后端 API 基础地址（默认 `http://localhost:3000`） |

**Backend (`apps/server/.env.example`)**

| 变量名 | 用途 |
|--------|------|
| `DATABASE_URL` | SQLite 文件路径（默认 `file:./sqlite.db`） |
| `PORT` | 监听端口（默认 `3000`） |
| `CORS_ORIGIN` | 允许的跨域来源（默认 `http://localhost:5173`） |
| `MIGRATIONS_DIR` | 生产环境 migration 文件目录（构建二进制时使用） |

## Key Conventions

**Frontend**

- `apps/web/src/services/schema.gen.ts` 由 openapi-typescript 自动生成，运行 `bun codegen:api` 更新，**禁止手动修改**
- API 类型通过 `components['schemas']['...']` 从生成文件导入（如 `type User = components['schemas']['user.item']`）
- API 请求使用 openapi-fetch 解构模式：`const { data, error } = await client.GET('/api/...')`，错误时用 `throw new Error(getApiErrorMessage(error))`，响应数据用 `unwrapApiResponse(data as EnvelopeType)` 提取
- Zustand store 统一通过 `createStore<T>(name, initializer)` 工厂创建（`store/createStore.ts`），自动注入 devtools
- 所有异步 action 在 store 内部定义，组件只调用 store 暴露的方法，不直接调用 `client`
- 使用 `verbatimModuleSyntax`，类型导入必须用 `import type`（如 `import type { StateCreator } from 'zustand'`）

**Backend**

- Elysia controller 同时承担路由定义和处理器绑定职责（无独立 routes 层），使用 `new Elysia({ prefix: '/api/...' })` 定义前缀
- HTTP 返回体统一使用 `{ code, msg, data }` 协议：成功响应固定 `code=0,msg='ok'`，错误响应 `code!=0,data=null`
- 统一响应协议通过 Elysia plugin 集中处理；controller/service 保持返回领域数据与抛错语义，不重复手工包裹
- Elysia model key 遵循 `domain.purpose` 命名（如 `user.create`、`user.item`、`user.list`），在 `models/` 目录下声明后通过 `.use(Model)` 注入
- Service 层使用 `static` 类方法（`UserService.findAll()`），不实例化
- Drizzle 表定义在 `src/db/schema.ts`，通过 `$inferSelect` / `$inferInsert` 导出 TypeScript 类型，**禁止手写重复类型**
- 后端 TypeScript 使用 `moduleResolution: nodenext`，所有本地导入必须带 `.js` 扩展名（如 `import { db } from './db/index.js'`）
- 后端有 `@/*` 路径别名指向 `src/*`（tsconfig.json paths 字段）
