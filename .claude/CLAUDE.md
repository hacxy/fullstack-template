# Project Conventions

## Stack

- **Monorepo**: Bun workspaces (`apps/*`, `packages/*`)
- **Backend** (`apps/server`): Bun + Elysia + Prisma + SQLite
- **Frontend** (`apps/web`): React 19 + Vite + React Router + Zustand
- **Shared** (`packages/shared`): Cross-app types and utilities
- **Linting**: `@antfu/eslint-config` with `lint-staged` + `commitlint` git hooks

## File & Directory Naming

| Category | Convention | Examples |
|----------|------------|---------|
| Directories | kebab-case | `pages/`, `layouts/`, `store/`, `router/`, `routes/`, `db/` |
| React component files | PascalCase | `Home.tsx`, `RootLayout.tsx`, `NotFound.tsx` |
| Component-paired CSS | PascalCase, same name as component | `RootLayout.css` |
| Non-component TS/TSX files | camelCase | `main.tsx`, `counter.ts`, `index.ts`, `createStore.ts` |
| Global CSS | camelCase | `index.css` |
| Static assets | kebab-case | `hero.png`, `react.svg` |
| Config files | camelCase or framework convention | `vite.config.ts`, `prisma.config.ts`, `eslint.config.js` |

## Project Structure

```
apps/
  server/          # Elysia API server
    prisma/        # Schema and SQLite database
    tests/         # bun:test unit & integration tests (mirrors src/ structure)
    src/
      db/          # Prisma client
      models/      # Elysia type models (namespace.purpose key convention, e.g. user.create)
      controllers/ # Request handlers (thin layer, delegates to services)
      services/    # Business logic
      routes/      # Route definitions and handler wiring
      index.ts     # Server entry point (port 3000, Swagger at /scalar)
  web/             # React frontend
    e2e/           # Playwright tests
    public/        # Static assets
    src/
      assets/      # Images and SVGs
      layouts/     # Layout components
      pages/       # Page components
      router/      # React Router config
      store/       # Zustand stores
      App.tsx
      main.tsx
packages/
  shared/          # Shared types (e.g., ApiResponse<T>)
```
