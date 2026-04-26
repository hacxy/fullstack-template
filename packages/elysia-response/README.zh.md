# elysia-response

一个可配置的响应契约与 Elysia 插件，用于统一 API 响应 envelope。

[English](./README.md)

## 功能特性

- 自动将处理器返回值包裹为统一的 `{ code, msg, data }` envelope。
- 将 Elysia 框架错误映射为业务错误码并设置对应 HTTP 状态码。
- 自动拦截并改写 OpenAPI spec 的响应 schema，注入成功 envelope 结构。
- 支持 `filterNull` 选项，过滤运行时响应及 OpenAPI schema 中的 null 字段。
- 提供底层契约工具函数，支持手动调用。

## 前置要求

- 支持 ESM 的 `Node.js` 或 `Bun` 运行时
- `elysia` `^1.4.28`（peer dependency）

## 安装

```bash
# npm
npm install elysia-response elysia

# pnpm
pnpm add elysia-response elysia

# bun
bun add elysia-response elysia
```

## 快速开始

```ts
import { Elysia } from 'elysia'
import { response } from 'elysia-response'

const app = new Elysia()
  .use(response())
  .get('/health', () => ({ status: 'ok' }))
```

插件会拦截每个 JSON 响应，若返回值尚未是 envelope，则自动包裹：

```json
{ "code": 0, "msg": "ok", "data": { "status": "ok" } }
```

## API

### `response(options?)`

创建 Elysia 插件，行为包括：

- 将非 envelope 的 JSON 响应包裹为 `{ code: 0, msg: "ok", data: ... }`。
- 将 Elysia 错误码映射为业务错误码并设置对应 HTTP 状态码。
- 拦截 OpenAPI spec，将所有 2xx 响应 schema 改写为成功 envelope 结构，并自动注入 422/500 错误 schema。

### `createSuccessResponse(data, message?)`

手动创建成功 envelope：`{ code: 0, msg, data }`。

### `createErrorResponse(code, message)`

手动创建错误 envelope：`{ code, msg }`。

### `isResponseEnvelope(payload)`

若 payload 已具有 `{ code: number, msg: string }` 结构（已包裹），返回 `true`。

### `resolveErrorMapping(contextCode)`

根据 Elysia 错误码字符串查询内置错误映射，返回 `{ businessCode, statusCode, defaultMessage }`。

## 配置项

### `ResponseOptions`

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `filterNull` | `false` | 过滤运行时响应中的 null 字段，并调整 OpenAPI schema 中的可空字段 |

#### `filterNull` 行为说明

- 运行时：响应对象中值为 null 的字段会从 envelope `data` 中被移除。
- 若整个响应值为 `null`，返回不含 `data` 字段的 envelope：`{ code: 0, msg: "ok" }`。
- OpenAPI spec 中：`t.Null()` 类型字段从 properties 中移除；`t.Nullable(X)` 字段从 `required` 中移除。

### 内置错误映射

| Elysia 错误码 | 业务码 | HTTP 状态码 | 默认消息 |
| --- | --- | --- | --- |
| `VALIDATION` | `1001` | `422` | `Request validation failed` |
| `PARSE` | `1002` | `400` | `Request payload parse failed` |
| `NOT_FOUND` | `1004` | `404` | `Resource not found` |
| `INTERNAL_SERVER_ERROR` | `1500` | `500` | `Internal server error` |

## 项目结构

```text
src/
  contract.ts   # 框架无关的响应契约核心
  elysia.ts     # Elysia 插件与 OpenAPI spec 转换
  index.ts      # 对外导出入口
```

## 导出成员

**值导出：** `response`、`createSuccessResponse`、`createErrorResponse`、`isResponseEnvelope`、`resolveErrorMapping`

**类型导出：** `ApiResponse`、`ResponseOptions`、`ErrorMapping`

## 许可证

当前包未单独声明 license 文件，遵循仓库整体策略。

---

> English documentation: [README.md](./README.md)
