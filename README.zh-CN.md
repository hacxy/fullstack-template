# Fullstack Template

基于 Bun workspaces 的全栈 Monorepo 模板，包含后端 API 服务和 React 前端。

> [English](README.md) | 中文

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | [Bun](https://bun.sh/) |
| 后端 | [Elysia](https://elysiajs.com/) + [Prisma](https://www.prisma.io/) + SQLite |
| 前端 | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [React Router](https://reactrouter.com/) |
| 状态管理 | [Zustand](https://zustand-demo.pmnd.rs/) |
| 共享包 | TypeScript 类型与工具函数 |
| 代码规范 | [@antfu/eslint-config](https://github.com/antfu/eslint-config) + lint-staged + commitlint |
| 测试 | Bun test（单元测试）+ [Playwright](https://playwright.dev/)（E2E） |

## 项目结构

```
fullstack-template/
├── apps/
│   ├── server/          # Elysia API 服务（端口 3000）
│   └── web/             # React 前端（端口 5173）
└── packages/
    └── shared/          # 共享类型（如 ApiResponse<T>）
```

## 快速开始

### 前置要求

- [Bun](https://bun.sh/) >= 1.0

### 安装依赖

```bash
bun install
```

### 初始化数据库

```bash
bun db:migrate
```

### 启动开发环境

```bash
bun dev
```

同时启动后端服务（http://localhost:3000）和前端开发服务器（http://localhost:5173）。

---

## 后端服务 (`apps/server`)

基于 Bun 运行时，使用 [Elysia](https://elysiajs.com/) 构建的高性能 REST API 服务。

### 目录结构

```
apps/server/
├── prisma/
│   ├── schema.prisma    # 数据模型定义
│   ├── migrations/      # SQL 迁移历史（需提交到版本控制）
│   └── sqlite.db        # 本地数据库文件（已 git-ignore）
└── src/
    ├── db/              # Prisma 客户端实例
    ├── models/          # Elysia 请求/响应类型模型
    ├── controllers/     # 请求处理器（薄层，委托给 service）
    ├── services/        # 业务逻辑
    │   └── __tests__/   # 单元测试
    ├── routes/          # 路由定义与处理器绑定
    └── index.ts         # 入口——端口 3000，Swagger 在 /scalar
```

### 核心特性

- **Elysia** — 快速、类型安全的 Web 框架，支持端到端类型推导
- **Prisma** — 类型安全的 ORM，支持自动迁移
- **SQLite** via `better-sqlite3` — 零配置本地数据库
- **Swagger / Scalar UI** — 在 `/scalar` 自动生成 API 文档
- **热重载** — `bun --watch` 文件变更时自动重启

### 数据库脚本

在项目根目录执行：

| 脚本 | 说明 |
|------|------|
| `bun db:migrate` | 创建新迁移并应用 |
| `bun db:generate` | 修改 schema 后重新生成 Prisma 客户端 |
| `bun db:studio` | 打开 Prisma Studio（数据库可视化工具） |
| `bun db:reset` | 清空数据并重新执行所有迁移 |

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/users` | 获取所有用户 |
| POST | `/api/users` | 创建新用户 |

完整交互文档：http://localhost:3000/scalar（仅开发环境）

### 单元测试

```bash
cd apps/server
bun test
```

---

## 前端应用 (`apps/web`)

基于 [Vite](https://vitejs.dev/) 构建的 React 19 单页应用。

### 目录结构

```
apps/web/
├── e2e/                 # Playwright 端到端测试
├── public/              # 静态资源（原样提供）
└── src/
    ├── assets/          # 图片和 SVG（由组件导入）
    ├── layouts/         # 公共布局组件（如 RootLayout）
    ├── pages/           # 每个路由对应一个组件（Home、NotFound 等）
    ├── router/          # React Router 配置
    ├── store/           # Zustand 状态管理
    ├── App.tsx          # 根组件
    └── main.tsx         # 入口文件
```

### 核心特性

- **React 19** — 最新 React，支持并发特性
- **React Router** — 客户端路由，支持嵌套布局
- **Zustand** — 轻量级全局状态管理
- **Vite** — 即时 HMR 开发服务器与优化的生产构建
- **Playwright** — 基于浏览器自动化的 E2E 测试

### 开发服务器

```bash
bun dev   # 在根目录执行，或：
cd apps/web && bun dev
```

启动后访问 http://localhost:5173，已启用 HMR。

### E2E 测试

```bash
cd apps/web
bun test:e2e        # 无头模式
bun test:e2e:ui     # 交互式 UI 模式
```

---

## 共享包 (`packages/shared`)

以 `@repo/shared` 引入，包含 server 和 web 之间共享的 TypeScript 类型，如 `ApiResponse<T>`。

---

## 根目录脚本

| 脚本 | 说明 |
|------|------|
| `bun dev` | 启动所有工作区的开发模式 |
| `bun build` | 构建所有工作区 |
| `bun lint:fix` | 自动修复所有工作区的 lint 问题 |

---

## Git 提交规范

本项目通过 [commitlint](https://commitlint.js.org/) 校验提交信息格式，并通过 [lint-staged](https://github.com/okonet/lint-staged) 在每次提交前对暂存文件执行 ESLint 检查。

提交信息须遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
feat: 添加用户登录功能
fix: 修复 API 返回空值时的异常
chore: 更新依赖版本
```
