# Fullstack Template

基于 Bun workspaces 的全栈 Monorepo 模板，包含后端 API 服务和 React 前端。

> [English](README.md) | 中文

## 技术栈

| 层级 | 技术 |
|------|------|
| 运行时 | [Bun](https://bun.sh/) |
| 后端 | [Elysia](https://elysiajs.com/) + [Drizzle ORM](https://orm.drizzle.team/) + SQLite |
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

### 配置环境变量

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example    apps/web/.env
```

按需修改其中的值。Bun 会自动加载 `.env` 文件，无需额外配置。

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
├── drizzle/             # SQL 迁移文件（需提交到版本控制）
│   └── meta/            # 迁移日志与快照
├── src/
│   ├── db/              # Drizzle 客户端实例与 schema 定义
│   ├── models/          # Elysia 请求/响应类型模型
│   ├── controllers/     # 请求处理器（薄层，委托给 service）
│   ├── services/        # 业务逻辑
│   └── index.ts         # 入口——执行迁移后启动服务，端口 3000
└── sqlite.db            # 本地数据库文件（已 git-ignore）
```

### 核心特性

- **Elysia** — 快速、类型安全的 Web 框架，支持端到端类型推导
- **Drizzle ORM** — 类型安全的 SQL，schema 优先的迁移管理
- **SQLite** via `@libsql/client` — 零配置本地数据库
- **自动迁移** — `migrate()` 在每次服务器启动时执行，可重复运行且幂等
- **Swagger / Scalar UI** — 在 `/scalar` 自动生成 API 文档
- **热重载** — `bun --watch` 文件变更时自动重启

### 数据库脚本

在项目根目录执行：

| 脚本 | 说明 |
|------|------|
| `bun db:generate` | 根据 schema 变更生成新的 SQL 迁移文件 |
| `bun db:migrate` | 将待执行的迁移应用到本地数据库 |
| `bun db:push` | 直接同步 schema（仅开发用，不记录迁移历史） |
| `bun db:studio` | 打开 Drizzle Studio（数据库可视化工具） |

> **Schema 变更工作流：** 修改 `apps/server/src/db/schema.ts` → 执行 `bun db:generate` → 将 `apps/server/drizzle/` 下的新文件提交到 Git → 执行 `bun db:migrate`。

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 健康检查——返回 `{ "status": "ok" }` |
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

---

## 部署

项目通过 GitHub Actions 部署到自托管的 Linux x64 服务器。工作流手动触发，依次执行 lint 检查、运行测试、构建自包含的服务端二进制和前端静态文件，最后通过 SSH 上传到服务器。

**服务器架构：**

- **后端** — 以 systemd 服务（`{project}-server`）运行，监听端口 3000
- **前端** — 静态文件由 Nginx 提供服务
- **Nginx** — 将 `/api/` 反向代理到后端，其余路径作为 SPA 静态文件处理

### 第一步 — 首次初始化

在本地执行一次初始化脚本，它会通过 SSH 自动完成服务器上的用户、目录、systemd 服务和 Nginx 配置：

```bash
bun run setup
```

脚本会交互式询问服务器地址、本地 SSH 私钥路径、域名等配置（均有合理默认值）。脚本会自动识别 Linux 发行版，选择正确的 Nginx 配置路径（Debian/Ubuntu 使用 `sites-available`；RHEL/CentOS 使用 `conf.d`）。支持 HTTPS 配置——可选 Let's Encrypt（自动申请免费证书）、手动证书，或仅 HTTP。执行完成后会打印需要在 GitHub 中配置的 Secrets。

**初始化后的目录结构：**

```
/opt/{project}/
├── server/
│   ├── bin/
│   │   └── server          # 自包含二进制（每次部署替换）
│   ├── drizzle/            # SQL 迁移文件（每次部署同步）
│   └── sqlite.db           # 数据库文件（部署时永不覆盖）
└── web/                    # 前端静态文件
```

### 第二步 — 配置 GitHub Secrets

在仓库的 **Settings → Secrets and variables → Actions** 中添加以下配置：

| 配置项 | 说明 |
|--------|------|
| `SERVER_HOST`（secret） | 服务器 IP 或域名 |
| `SERVER_USER`（secret） | SSH 登录用户名（如 `deploy`） |
| `SSH_PRIVATE_KEY`（secret） | SSH 私钥的完整内容 |
| `PROD_WEB_API_URL`（secret） | 生产环境 API 基础地址。部署时会写入 `apps/web/.env.production` 的 `VITE_API_URL`，并在部署完成后用于健康检查。已配置 HTTPS 则用 `https://`，否则用 `http://`（例如 `https://api.example.com` 或 `http://1.2.3.4`） |

### 第三步 — 触发部署

在 GitHub 仓库页面点击 **Actions → Deploy → Run workflow** 手动触发部署。

流程执行顺序如下：

```
lint ──┐
       ├─► build-server ──┐
test ──┘                   ├─► deploy
       └─► build-web ──────┘
```

可在 GitHub 的 **Actions** 标签页中查看实时进度。

### 注意事项

- **数据库安全** — `sqlite.db` 不包含在构建产物中，部署时永远不会被覆盖。每次部署只同步 `drizzle/` 迁移文件。
- **自动迁移** — 服务端二进制启动时自动执行 `migrate()`。首次部署自动创建数据库并应用全部迁移；后续部署只应用新增迁移。无需手动执行任何迁移命令。
- **无需服务器上的 Bun** — 服务端二进制自包含，内嵌迁移逻辑，生产服务器上不需要安装 Bun。
- **停机时间** — 由于 SQLite 单写限制，替换二进制时服务会短暂停止（约 1~3 秒）。
- **修改 CORS 来源** — 在 `bun run setup` 交互步骤中设置。如需修改，编辑 `/etc/systemd/system/{project}-server.service` 中的 `CORS_ORIGIN` 行，然后执行 `sudo systemctl daemon-reload && sudo systemctl restart {project}-server`。
