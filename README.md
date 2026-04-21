# Fullstack Template

A monorepo fullstack template based on Bun workspaces, including a backend API server and a React frontend.

> English | [中文](README.zh-CN.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh/) |
| Backend | [Elysia](https://elysiajs.com/) + [Prisma](https://www.prisma.io/) + SQLite |
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
├── prisma/
│   ├── schema.prisma    # Data models
│   ├── migrations/      # SQL migration history (committed to VCS)
│   └── sqlite.db        # Local database file (git-ignored)
└── src/
    ├── db/              # Prisma client instance
    ├── models/          # Elysia request/response type models
    ├── controllers/     # Thin request handlers, delegate to services
    ├── services/        # Business logic
    │   └── __tests__/   # Unit tests
    ├── routes/          # Route definitions and handler wiring
    └── index.ts         # Entry point — port 3000, Swagger at /scalar
```

### Key Features

- **Elysia** — fast, type-safe web framework with end-to-end type inference
- **Prisma** — type-safe ORM with automatic migrations
- **SQLite** via `better-sqlite3` — zero-config local database
- **Swagger / Scalar UI** — auto-generated API docs at `/scalar`
- **Hot reload** — `bun --watch` restarts on file changes

### Database Scripts

Run from the repo root:

| Script | Description |
|--------|-------------|
| `bun db:migrate` | Create a new migration and apply it |
| `bun db:generate` | Regenerate the Prisma client after schema changes |
| `bun db:studio` | Open Prisma Studio (GUI for the database) |
| `bun db:reset` | Drop all data and re-run all migrations |

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
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
    ├── store/           # Zustand stores
    ├── App.tsx          # Root component
    └── main.tsx         # Entry point
```

### Key Features

- **React 19** — latest React with concurrent features
- **React Router** — client-side routing with nested layouts
- **Zustand** — lightweight global state management
- **Vite** — instant HMR dev server and optimized production build
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
| `bun lint:fix` | Auto-fix lint issues across all workspaces |

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

The project deploys to a self-hosted Linux x64 server via GitHub Actions. Pushing a `prod_*` tag triggers the workflow, which runs lint + tests, builds a self-contained server binary and the web static files, then uploads them to the server over SSH.

**Architecture on the server:**

- **Backend** — runs as a systemd service (`myapp-server`), serves on port 3000
- **Frontend** — static files served by Nginx
- **Nginx** — reverse proxies `/api/` to the backend, serves everything else as SPA static files

### Step 1 — First-time server setup

Run `scripts/server-setup.sh` once on your server (requires sudo):

```bash
# Usage: bash server-setup.sh [deploy_user] [deploy_pubkey]
bash scripts/server-setup.sh deploy "ssh-ed25519 AAAA... github-actions"
```

This creates the `myapp` service user, directory structure, systemd service, and sudo permissions for the deploy user.

**Expected directory layout after setup:**

```
/opt/myapp/
├── server/
│   ├── bin/server          # self-contained binary (replaced on each deploy)
│   └── prisma/
│       ├── sqlite.db       # database file (never overwritten by deploys)
│       ├── schema.prisma
│       └── migrations/
└── web/                    # frontend static files
```

### Step 2 — Configure Nginx

Copy `scripts/nginx-myapp.conf` to your server, update `server_name`, then enable it:

```bash
sudo cp nginx-myapp.conf /etc/nginx/sites-available/myapp
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Step 3 — Configure GitHub Secrets

In your repository go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `SERVER_HOST` | Server IP or domain |
| `SERVER_USER` | SSH login username (e.g. `deploy`) |
| `SSH_PRIVATE_KEY` | Full content of the SSH private key |

### Step 4 — Deploy

Push a `prod_` prefixed tag to trigger the deployment workflow:

```bash
git tag prod_v1.0.0
git push origin prod_v1.0.0
```

The workflow runs in this order:

```
lint ──┐
       ├─► build-server ──┐
test ──┘                   ├─► deploy
       └─► build-web ──────┘
```

You can monitor progress in the **Actions** tab on GitHub.

### Notes

- **Database safety** — `sqlite.db` is never included in build artifacts and is never overwritten during deployment. Only `migrations/` and `schema.prisma` are synced.
- **Database migrations** — `prisma migrate deploy` runs automatically on each deploy. On first deploy it creates the database and applies all migrations.
- **Downtime** — Due to SQLite's single-writer constraint, the service stops briefly (~1–3 s) while the binary is replaced.
- **Bun on server** — Only needed for running migrations. The server binary is self-contained and does not require Bun to run. The setup script installs Bun automatically on first deploy if not present.
