# elysia-response

一个可配置的响应契约与 Elysia 插件，用于统一 API 响应 envelope。

[English](./README.md)

## 功能特性

- 提供框架无关的 `createResponseContract` 核心能力。
- 提供 Elysia 专用 `response()` 插件，统一处理成功/失败响应包裹。
- 支持自定义 envelope 字段映射（例如将 `code/msg/data` 改为 `status/message/payload`）。
- 支持可配置的业务错误码映射与兜底策略。
- 使用同一份契约配置生成 Elysia 响应声明 schema。

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

## API

### `response(options?)`

创建 Elysia 插件，行为包括：

- 将非 envelope 的成功响应自动包裹为统一结构
- 将框架错误映射为业务错误码并设置对应状态码
- 对 `/scalar` 路由跳过包裹

### `createElysiaResponseContract(options?)`

创建 Elysia 契约对象，包含：

- `createSuccessResponse()`
- `createErrorResponse()`
- `createSuccessResponseSchema()`
- `createErrorResponseSchema()`
- `resolveErrorMapping()`
- `isResponseEnvelope()`

### `createElysiaResponseKit(options?)`

同时返回契约与插件：

```ts
const kit = createElysiaResponseKit()
app.use(kit.plugin)
```

### `createResponseContract(options?)`

框架无关的核心契约工厂，便于接入其他运行时。

## 配置项

### `ElysiaResponseOptions`

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `envelope.code` | `code` | 业务码字段名 |
| `envelope.message` | `msg` | 消息字段名 |
| `envelope.data` | `data` | 数据字段名 |
| `successCodeValue` | `0` | 成功业务码值 |
| `errorMapping` | 内置映射 | 覆盖或扩展错误映射 |
| `defaultErrorKey` | `INTERNAL_SERVER_ERROR` | 兜底映射键 |
| `descriptions` | 内置描述 | Elysia 模型声明中的 OpenAPI 描述 |

### 内置错误映射

- `VALIDATION` -> `businessCode: 1001`, `statusCode: 422`
- `PARSE` -> `businessCode: 1002`, `statusCode: 400`
- `NOT_FOUND` -> `businessCode: 1004`, `statusCode: 404`
- `INTERNAL_SERVER_ERROR` -> `businessCode: 1500`, `statusCode: 500`

## 项目结构

```text
src/
  contract.ts   # 框架无关的响应契约核心
  elysia.ts     # Elysia 适配与插件
  index.ts      # 对外导出入口
```

## 导出成员

- 值导出：`response`、`createElysiaResponseContract`、`createElysiaResponseKit`、`createResponseContract`、`DEFAULT_ERROR_KEY`、`DEFAULT_ERROR_MAPPING`
- 类型导出：`ApiResponse`、`ElysiaResponseOptions`、`ElysiaResponseKit`、`ResponseContract`、`ResponseContractOptions`、`ErrorMapping`、`ErrorMappingTable`

## 许可证

当前包未单独声明 license 文件，遵循仓库整体策略。

---

> English documentation: [README.md](./README.md)
