# elysia-plugin-response

A configurable response contract and Elysia plugin for unified API envelopes.

[中文](./README.zh.md)

## Features

- Provides a framework-agnostic `createResponseContract` core.
- Provides Elysia-specific `response()` plugin for global success/error envelope handling.
- Supports custom envelope field mapping (for example: `code/msg/data` -> `status/message/payload`).
- Supports configurable business error mapping and default fallback behavior.
- Generates Elysia response schemas from the same contract configuration.

## Prerequisites

- `Node.js` or `Bun` runtime with ESM support
- `elysia` `^1.4.28` (peer dependency)

## Installation

```bash
# npm
npm install elysia-plugin-response elysia

# pnpm
pnpm add elysia-plugin-response elysia

# bun
bun add elysia-plugin-response elysia
```

## Quick Start

```ts
import { Elysia } from 'elysia'
import { response } from 'elysia-plugin-response'

const app = new Elysia()
  .use(response())
  .get('/health', () => ({ status: 'ok' }))
```

## API

### `response(options?)`

Creates an Elysia plugin that:

- wraps non-envelope successful responses into a unified envelope
- maps framework errors to business errors with status codes
- skips wrapping for `/scalar` routes

### `createElysiaResponseContract(options?)`

Creates an Elysia-aware contract with:

- `createSuccessResponse()`
- `createErrorResponse()`
- `createSuccessResponseSchema()`
- `createErrorResponseSchema()`
- `resolveErrorMapping()`
- `isResponseEnvelope()`

### `createElysiaResponseKit(options?)`

Returns both contract and plugin:

```ts
const kit = createElysiaResponseKit()
app.use(kit.plugin)
```

### `createResponseContract(options?)`

Framework-agnostic core contract factory for custom integration.

## Configuration

### `ElysiaResponseOptions`

| Option | Default | Description |
| --- | --- | --- |
| `envelope.code` | `code` | Envelope field name for business code |
| `envelope.message` | `msg` | Envelope field name for message |
| `envelope.data` | `data` | Envelope field name for payload |
| `successCodeValue` | `0` | Success business code value |
| `errorMapping` | Built-in mapping | Override or extend error mapping entries |
| `defaultErrorKey` | `INTERNAL_SERVER_ERROR` | Fallback mapping key |
| `descriptions` | Built-in descriptions | OpenAPI schema descriptions for Elysia models |

### Built-in Error Mapping

- `VALIDATION` -> `businessCode: 1001`, `statusCode: 422`
- `PARSE` -> `businessCode: 1002`, `statusCode: 400`
- `NOT_FOUND` -> `businessCode: 1004`, `statusCode: 404`
- `INTERNAL_SERVER_ERROR` -> `businessCode: 1500`, `statusCode: 500`

## Project Structure

```text
src/
  contract.ts   # framework-agnostic response contract
  elysia.ts     # Elysia adapter and plugin
  index.ts      # public exports
```

## Exported Members

- Values: `response`, `createElysiaResponseContract`, `createElysiaResponseKit`, `createResponseContract`, `DEFAULT_ERROR_KEY`, `DEFAULT_ERROR_MAPPING`
- Types: `ApiResponse`, `ElysiaResponseOptions`, `ElysiaResponseKit`, `ResponseContract`, `ResponseContractOptions`, `ErrorMapping`, `ErrorMappingTable`

## License

Currently no standalone license file is defined for this package. It follows the repository policy.

---

> 中文文档请见 [README.zh.md](./README.zh.md)
