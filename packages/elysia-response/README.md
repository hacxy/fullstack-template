# elysia-response

A configurable response contract and Elysia plugin for unified API envelopes.

[中文](./README.zh.md)

## Features

- Wraps handler return values into a unified `{ code, msg, data }` envelope automatically.
- Maps Elysia framework errors to business error codes and HTTP status codes.
- Intercepts and rewrites OpenAPI spec responses to include the success envelope schema.
- Supports `filterNull` option to strip `null` fields from runtime responses and OpenAPI schemas.
- Provides low-level contract helpers for manual use.

## Prerequisites

- `Node.js` or `Bun` runtime with ESM support
- `elysia` `^1.4.28` (peer dependency)

## Installation

```bash
# npm
npm install elysia-response elysia

# pnpm
pnpm add elysia-response elysia

# bun
bun add elysia-response elysia
```

## Quick Start

```ts
import { Elysia } from 'elysia'
import { response } from 'elysia-response'

const app = new Elysia()
  .use(response())
  .get('/health', () => ({ status: 'ok' }))
```

The plugin intercepts every JSON response. If the return value is not already an envelope, it wraps it:

```json
{ "code": 0, "msg": "ok", "data": { "status": "ok" } }
```

## API

### `response(options?)`

Creates an Elysia plugin that:

- Wraps non-envelope JSON responses into `{ code: 0, msg: "ok", data: ... }`.
- Maps Elysia error codes to business error codes with appropriate HTTP status codes.
- Intercepts the OpenAPI spec and rewrites all 2xx response schemas to reflect the success envelope, and auto-injects 422/500 error schemas.

### `createSuccessResponse(data, message?)`

Manually create a success envelope: `{ code: 0, msg, data }`.

### `createErrorResponse(code, message)`

Manually create an error envelope: `{ code, msg }`.

### `isResponseEnvelope(payload)`

Returns `true` if the payload already has a `{ code: number, msg: string }` shape (already wrapped).

### `resolveErrorMapping(contextCode)`

Looks up the built-in error mapping for an Elysia error code string and returns `{ businessCode, statusCode, defaultMessage }`.

## Configuration

### `ResponseOptions`

| Option | Default | Description |
| --- | --- | --- |
| `filterNull` | `false` | Strip `null` fields from runtime responses and adjust nullable fields in OpenAPI schemas |

#### `filterNull` behavior

- At runtime: null-valued fields are omitted from the envelope `data` object.
- If the entire response value is `null`, the envelope is returned without a `data` field: `{ code: 0, msg: "ok" }`.
- In the OpenAPI spec: `t.Null()` fields are removed from properties; `t.Nullable(X)` fields are removed from `required`.

### Built-in Error Mapping

| Elysia Error Code | Business Code | HTTP Status | Default Message |
| --- | --- | --- | --- |
| `VALIDATION` | `1001` | `422` | `Request validation failed` |
| `PARSE` | `1002` | `400` | `Request payload parse failed` |
| `NOT_FOUND` | `1004` | `404` | `Resource not found` |
| `INTERNAL_SERVER_ERROR` | `1500` | `500` | `Internal server error` |

## Project Structure

```text
src/
  contract.ts   # framework-agnostic response contract
  elysia.ts     # Elysia plugin and OpenAPI spec transformation
  index.ts      # public exports
```

## Exported Members

**Values:** `response`, `createSuccessResponse`, `createErrorResponse`, `isResponseEnvelope`, `resolveErrorMapping`

**Types:** `ApiResponse`, `ResponseOptions`, `ErrorMapping`

## License

Currently no standalone license file is defined for this package. It follows the repository policy.

---

> 中文文档请见 [README.zh.md](./README.zh.md)
