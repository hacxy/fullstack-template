# Fullstack Template

A monorepo fullstack template based on Bun workspaces, including a backend API server and a React frontend.

> English | [中文](README.zh-CN.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh/) |
| Backend | [Elysia](https://elysiajs.com/) + [Drizzle ORM](https://orm.drizzle.team/) + SQLite |
| Frontend | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [React Router](https://reactrouter.com/) |
| State Management | [Zustand](https://zustand-demo.pmnd.rs/) |
| Shared Package | TypeScript types and utilities |
| Linting | [@antfu/eslint-config](https://github.com/antfu/eslint-config) + lint-staged + commitlint |
| Testing | Bun test (unit) + [Playwright](https://playwright.dev/) (E2E) |

## Project Structure

```
fullstack-template/
├── apps/
│   ├── server/          # Elysia API server (port 3000)
│   └── web/             # React frontend (port 5173)
└── packages/
    └── shared/          # Shared types (e.g. ApiResponse<T>)
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0

### Install

```bash
bun install
```

### Environment variables

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example    apps/web/.env
```

Edit the values as needed. Bun loads `.env` automatically — no extra setup required.

### Initialize the database

```bash
bun db:migrate
```

### Development

```bash
bun dev
```

This starts both the backend server (http://localhost:3000) and the frontend dev server (http://localhost:5173) simultaneously.

---

## Server (`apps/server`)

A high-performance REST API server built with [Elysia](https://elysiajs.com/) on the Bun runtime.

### Directory Structure

```
apps/server/
├── drizzle/             # SQL migration files (committed to VCS)
│   └── meta/            # Migration journal and snapshots
├── src/
│   ├── db/              # Drizzle client instance and schema
│   ├── models/          # Elysia request/response type models
│   ├── controllers/     # Thin request handlers, delegate to services
│   ├── services/        # Business logic
│   ├── app.ts           # Elysia app instance, middleware, route mounting
│   └── index.ts         # Entry point — runs migrations then starts on port 3000
└── sqlite.db            # Local database file (git-ignored)
```

### Key Features

- **Elysia** — fast, type-safe web framework with end-to-end type inference
- **Drizzle ORM** — type-safe SQL with schema-first migrations
- **SQLite** via `bun:sqlite` — Bun's native built-in SQLite driver, zero-config
- **Auto-migration** — `migrate()` runs on every server startup; safe to run repeatedly
- **Swagger / Scalar UI** — auto-generated API docs at `/scalar`
- **Hot reload** — `bun --watch` restarts on file changes

### Database Scripts

Run from the repo root:

| Script | Description |
|--------|-------------|
| `bun db:generate` | Generate a new SQL migration from schema changes |
| `bun db:migrate` | Apply pending migrations to the local database |
| `bun db:push` | Push schema changes directly (dev only, bypasses migrations) |
| `bun db:studio` | Open Drizzle Studio (GUI for the database) |

> **Schema change workflow:** Edit `apps/server/src/db/schema.ts` → run `bun db:generate` → commit the new file in `apps/server/drizzle/` → run `bun db:migrate`.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check — returns `{ "status": "ok" }` |
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create a new user |

Full interactive documentation: http://localhost:3000/scalar (dev only)

### Unit Tests

```bash
cd apps/server
bun test
```

---

## Web (`apps/web`)

A React 19 single-page application built with [Vite](https://vitejs.dev/).

### Directory Structure

```
apps/web/
├── e2e/                 # Playwright end-to-end tests
├── public/              # Static assets served as-is
└── src/
    ├── assets/          # Images and SVGs (imported by components)
    ├── layouts/         # Shared layout components (e.g. RootLayout)
    ├── pages/           # One component per route (Home, NotFound, …)
    ├── router/          # React Router configuration
    ├── services/        # openapi-fetch client and generated API types
    ├── store/           # Zustand stores
    ├── App.tsx          # Root component
    └── main.tsx         # Entry point
```

### Key Features

- **React 19** — latest React with concurrent features
- **React Router** — client-side routing with nested layouts
- **Zustand** — lightweight global state management
- **Vite** — instant HMR dev server and optimized production build
- **openapi-fetch** — type-safe API client generated from the server's OpenAPI spec
- **Playwright** — E2E tests with browser automation

### Dev Server

```bash
bun dev   # from repo root, or:
cd apps/web && bun dev
```

Runs at http://localhost:5173 with HMR enabled.

### E2E Tests

```bash
cd apps/web
bun test:e2e        # headless
bun test:e2e:ui     # interactive UI mode
```

---

## Shared Package (`packages/shared`)

Imported as `@repo/shared`. Contains TypeScript types shared between server and web, such as `ApiResponse<T>`.

---

## Scripts (root)

| Script | Description |
|--------|-------------|
| `bun dev` | Start all workspaces in dev mode |
| `bun build` | Build all workspaces |
| `bun test` | Run all tests (E2E + unit) |
| `bun lint:fix` | Auto-fix lint issues across all workspaces |
| `bun codegen:api` | Regenerate frontend API types from the server's OpenAPI spec |

---

## Git Conventions

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format, enforced by [commitlint](https://commitlint.js.org/). [lint-staged](https://github.com/okonet/lint-staged) runs ESLint on staged files before each commit.

```
feat: add user login
fix: handle null response from API
chore: update dependencies
```

---

## Deployment

The project deploys to a self-hosted Linux x64 server via GitHub Actions. The workflow is triggered manually and runs lint + tests, builds a self-contained server binary and the web static files, then uploads them to the server over SSH.

**Architecture on the server:**

- **Backend** — runs as a systemd service (`{project}-server`), serves on port 3000
- **Frontend** — static files served by Nginx
- **Nginx** — reverse proxies `/api/` to the backend, serves everything else as SPA static files

### Step 1 — First-time setup

Run the setup script once from your local machine. It will SSH into your server and configure users, directories, systemd service, and Nginx automatically:

```bash
bun run setup
```

The script will prompt for your server address, SSH key path, domain, and other settings (all have sensible defaults). It auto-detects the Linux distro to place the Nginx config correctly (Debian/Ubuntu use `sites-available`; RHEL/CentOS use `conf.d`). HTTPS is supported via Let's Encrypt (auto-issued free certificate) or a manual certificate — or skip it entirely for HTTP-only. After it completes, it prints the GitHub Secrets you need to configure.

**Expected directory layout after setup:**

```
/opt/{project}/
├── server/
│   ├── bin/
│   │   └── server          # self-contained binary (replaced on each deploy)
│   ├── drizzle/            # SQL migration files (synced on each deploy)
│   └── sqlite.db           # database file (never overwritten by deploys)
└── web/                    # frontend static files
```

### Step 2 — Configure GitHub Secrets

In your repository go to **Settings → Secrets and variables → Actions** and add:

| Key | Value |
|-----|-------|
| `SERVER_HOST` (secret) | Server IP or domain |
| `SERVER_USER` (secret) | SSH login username (e.g. `deploy`) |
| `SSH_PRIVATE_KEY` (secret) | Full content of the SSH private key |
| `PROD_WEB_API_URL` (secret) | Production API base URL injected into `apps/web/.env.production` as `VITE_API_URL` and reused by deployment health check. Use `https://` if HTTPS is configured, `http://` otherwise (e.g. `https://api.example.com` or `http://1.2.3.4`) |

### Step 3 — Deploy

Go to your repository on GitHub, click **Actions → Deploy → Run workflow** to trigger a deployment.

The workflow runs in this order:

```
lint ──┐
       ├─► build-server ──┐
test ──┘                   ├─► deploy
       └─► build-web ──────┘
```

You can monitor progress in the **Actions** tab on GitHub.

### Notes

- **Database safety** — `sqlite.db` is never included in build artifacts and is never overwritten during deployment. Only the `drizzle/` migration files are synced.
- **Auto-migration** — The server binary runs `migrate()` on startup. On first deploy it creates the database and applies all migrations; on subsequent deploys it only applies new ones. No manual migration step needed.
- **No Bun on server** — The server binary is self-contained and handles its own migrations. Bun is not required on the production server.
- **Downtime** — Due to SQLite's single-writer constraint, the service stops briefly (~1–3 s) while the binary is replaced.
- **CORS origin** — Set during `bun run setup`. To change it later, edit the `CORS_ORIGIN` line in `/etc/systemd/system/{project}-server.service` and run `sudo systemctl daemon-reload && sudo systemctl restart {project}-server`.
