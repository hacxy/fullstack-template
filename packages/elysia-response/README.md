# elysia-response

Elysia plugin for unified API response envelopes with automatic OpenAPI schema transformation.

[中文](./README.zh.md)

## Features

- Auto-wraps handler return values into a `{ code, msg, data }` envelope
- Maps Elysia errors to business error codes with appropriate HTTP status codes
- Rewrites OpenAPI spec 2xx schemas to reflect the envelope structure and injects 400/404/422/500 error schemas
- `filterNull` option strips null fields from runtime responses and OpenAPI schemas

## Installation

```bash
bun add elysia-response elysia
# npm install elysia-response elysia
# pnpm add elysia-response elysia
```

> Requires `elysia ^1.4.28` as a peer dependency.

## Usage

### Basic setup

```ts
import { Elysia } from 'elysia'
import { response } from 'elysia-response'

const app = new Elysia()
  .use(response())
  .get('/users/:id', () => ({ id: 1, name: 'Alice' }))
```

Success responses are automatically wrapped:

```json
{ "code": 0, "msg": "ok", "data": { "id": 1, "name": "Alice" } }
```

Elysia errors produce business error responses with the correct HTTP status:

```json
{ "code": 1004, "msg": "Resource not found" }
```

### filterNull

When `filterNull: true`, null-valued fields are stripped from responses at runtime and removed from `required` in OpenAPI schemas.

```ts
app.use(response({ filterNull: true }))
  .get('/profile', () => ({ name: 'Alice', bio: null }))
// → { "code": 0, "msg": "ok", "data": { "name": "Alice" } }
```

If the entire return value is `null`, the `data` field is omitted:

```ts
  .get('/optional', () => null)
// → { "code": 0, "msg": "ok" }
```

## API

### `response(options?)`

Creates the Elysia plugin. Accepts `ResponseOptions`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `filterNull` | `boolean` | `false` | Strip `null` fields from responses and OpenAPI schemas |

### `createSuccessResponse(data, message?)`

Use when you need a custom `msg` value (the default is `"ok"`), or when building an envelope without the plugin.

```ts
createSuccessResponse(data, 'created')
// { code: 0, msg: 'created', data: { ... } }
```

### `createErrorResponse(code, message)`

Use for application-level business errors inside a handler — cases the Elysia error system doesn't cover, such as duplicate emails or insufficient balance. The plugin detects the envelope shape via `isResponseEnvelope` and passes it through without re-wrapping.

```ts
.post('/users', async ({ body }) => {
  const exists = await UserService.emailExists(body.email)
  if (exists)
    return createErrorResponse(2001, 'Email already registered')
  return UserService.create(body)
})
// business error → { "code": 2001, "msg": "Email already registered" }
// success       → { "code": 0, "msg": "ok", "data": { ... } }
```

### `isResponseEnvelope(payload)`

Returns `true` if `payload` already has a `{ code: number, msg: string }` shape. The plugin skips wrapping for values that match.

### `resolveErrorMapping(contextCode)`

Returns the `ErrorMapping` for a given Elysia error code string.

```ts
resolveErrorMapping('NOT_FOUND')
// { businessCode: 1004, statusCode: 404, defaultMessage: 'Resource not found' }
```

## Error Mapping

| Elysia Error | Business Code | HTTP Status | Default Message |
| --- | --- | --- | --- |
| `VALIDATION` | 1001 | 422 | Request validation failed |
| `PARSE` | 1002 | 400 | Request payload parse failed |
| `INVALID_COOKIE_SIGNATURE` | 1003 | 400 | Invalid cookie signature |
| `NOT_FOUND` | 1004 | 404 | Resource not found |
| `INVALID_FILE_TYPE` | 1005 | 422 | Invalid file type |
| `INTERNAL_SERVER_ERROR` | 1500 | 500 | Internal server error |

## Exports

**Values:** `response`, `DEFAULT_ERROR_MAPPING`, `createSuccessResponse`, `createErrorResponse`, `isResponseEnvelope`, `resolveErrorMapping`

**Types:** `ApiResponse<T>`, `ResponseOptions`, `ErrorMapping`

## License

Follows the repository policy.

---

> 中文文档请见 [README.zh.md](./README.zh.md)
