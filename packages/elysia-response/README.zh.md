# elysia-response

Elysia 插件，用于统一 API 响应 envelope，并自动转换 OpenAPI schema。

[English](./README.md)

## 功能特性

- 自动将处理器返回值包裹为 `{ code, msg, data }` envelope
- 将 Elysia 错误映射为业务错误码并设置对应 HTTP 状态码
- 自动改写 OpenAPI spec 中 2xx 响应 schema 并注入 400/404/422/500 错误 schema
- `filterNull` 选项在运行时及 OpenAPI schema 中过滤 null 字段

## 安装

```bash
bun add elysia-response
# npm install elysia-response elysia
# pnpm add elysia-response elysia
```

> 需要 `elysia ^1.4.28` 作为 peer dependency。

## 使用

### 基本用法

```ts
import { Elysia } from 'elysia'
import { response } from 'elysia-response'

const app = new Elysia()
  .use(response())
  .get('/users/:id', () => ({ id: 1, name: 'Alice' }))
```

成功响应自动包裹：

```json
{ "code": 0, "msg": "ok", "data": { "id": 1, "name": "Alice" } }
```

Elysia 错误自动映射为业务错误响应并携带正确的 HTTP 状态码：

```json
{ "code": 1004, "msg": "Resource not found" }
```

### filterNull

开启 `filterNull: true` 后，响应对象中值为 null 的字段会在运行时被过滤，OpenAPI schema 中也会从 `required` 移除对应字段。

```ts
app.use(response({ filterNull: true }))
  .get('/profile', () => ({ name: 'Alice', bio: null }))
// → { "code": 0, "msg": "ok", "data": { "name": "Alice" } }
```

若整个返回值为 `null`，则 envelope 中不含 `data` 字段：

```ts
  .get('/optional', () => null)
// → { "code": 0, "msg": "ok" }
```

## API

### `response(options?)`

创建 Elysia 插件，接受 `ResponseOptions`：

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `filterNull` | `boolean` | `false` | 过滤响应及 OpenAPI schema 中的 null 字段 |

### `createSuccessResponse(data, message?)`

用于需要自定义 `msg` 字段（默认为 `"ok"`）的场合，或在不使用插件时手动构建 envelope。

```ts
createSuccessResponse(data, 'created')
// { code: 0, msg: 'created', data: { ... } }
```

### `createErrorResponse(code, message)`

用于在 handler 内返回应用层业务错误——即 Elysia 错误系统无法覆盖的场景，如邮箱重复、余额不足等。插件通过 `isResponseEnvelope` 检测到 envelope 结构后会直接透传，不会重复包裹。

```ts
.post('/users', async ({ body }) => {
  const exists = await UserService.emailExists(body.email)
  if (exists)
    return createErrorResponse(2001, 'Email already registered')
  return UserService.create(body)
})
// 业务错误 → { "code": 2001, "msg": "Email already registered" }
// 成功     → { "code": 0, "msg": "ok", "data": { ... } }
```

### `isResponseEnvelope(payload)`

若 `payload` 已具有 `{ code: number, msg: string }` 结构则返回 `true`，插件对已包裹的值跳过处理。

### `resolveErrorMapping(contextCode)`

根据 Elysia 错误码字符串返回对应的 `ErrorMapping`。

```ts
resolveErrorMapping('NOT_FOUND')
// { businessCode: 1004, statusCode: 404, defaultMessage: 'Resource not found' }
```

## 错误映射

| Elysia 错误码 | 业务码 | HTTP 状态码 | 默认消息 |
| --- | --- | --- | --- |
| `VALIDATION` | 1001 | 422 | Request validation failed |
| `PARSE` | 1002 | 400 | Request payload parse failed |
| `INVALID_COOKIE_SIGNATURE` | 1003 | 400 | Invalid cookie signature |
| `NOT_FOUND` | 1004 | 404 | Resource not found |
| `INVALID_FILE_TYPE` | 1005 | 422 | Invalid file type |
| `INTERNAL_SERVER_ERROR` | 1500 | 500 | Internal server error |

## 导出成员

**值导出：** `response`、`DEFAULT_ERROR_MAPPING`、`createSuccessResponse`、`createErrorResponse`、`isResponseEnvelope`、`resolveErrorMapping`

**类型导出：** `ApiResponse<T>`、`ResponseOptions`、`ErrorMapping`

## 许可证

遵循仓库整体策略。

---

> English documentation: [README.md](./README.md)
