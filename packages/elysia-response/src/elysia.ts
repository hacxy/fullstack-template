import { Elysia, t } from 'elysia'
import {
  createErrorResponse,
  createSuccessResponse,
  isResponseEnvelope,
  resolveErrorMapping,
  type ErrorMapping,
} from './contract.js'

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

const errorSchema = t.Object({
  code: t.Number({ description: 'Business error code for failed requests' }),
  msg: t.String({ description: 'Human readable error message' }),
})

const ERROR_SCHEMA_JSON = {
  type: 'object',
  required: ['code', 'msg'],
  properties: {
    code: { type: 'integer', description: 'Business error code for failed requests' },
    msg: { type: 'string', description: 'Human readable error message' },
  },
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0)
      return maybeMessage
  }
  return fallback
}

function isOpenApiSpec(value: unknown): boolean {
  if (!value || typeof value !== 'object')
    return false
  const obj = value as Record<string, unknown>
  return typeof obj.openapi === 'string' && !!obj.paths && !!obj.info
}

function wrapSuccessSchema(schema: unknown): object {
  return {
    type: 'object',
    required: ['code', 'msg', 'data'],
    properties: {
      code: { type: 'integer', const: 0, description: 'Business code: 0 means success' },
      msg: { type: 'string', description: 'Business message for successful response' },
      data: schema,
    },
  }
}

function transformOpenApiSpec(spec: Record<string, unknown>): Record<string, unknown> {
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined
  if (!paths)
    return spec

  const transformedPaths: Record<string, Record<string, unknown>> = {}

  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      transformedPaths[pathKey] = pathItem
      continue
    }

    const transformedPathItem = { ...pathItem }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation || typeof operation !== 'object')
        continue

      const op = operation as Record<string, unknown>
      const responses = op.responses as Record<string, unknown> | undefined
      if (!responses)
        continue

      const transformedResponses = { ...responses }

      for (const [statusCode, response] of Object.entries(responses)) {
        if (!statusCode.startsWith('2'))
          continue
        if (!response || typeof response !== 'object')
          continue

        const responseObj = response as Record<string, unknown>
        const content = responseObj.content as Record<string, unknown> | undefined
        if (!content)
          continue

        const jsonContent = content['application/json'] as Record<string, unknown> | undefined
        if (!jsonContent?.schema)
          continue

        transformedResponses[statusCode] = {
          ...responseObj,
          content: {
            ...content,
            'application/json': {
              ...jsonContent,
              schema: wrapSuccessSchema(jsonContent.schema),
            },
          },
        }
      }

      if (!transformedResponses['422']) {
        transformedResponses['422'] = {
          description: 'Validation error',
          content: { 'application/json': { schema: ERROR_SCHEMA_JSON } },
        }
      }
      if (!transformedResponses['500']) {
        transformedResponses['500'] = {
          description: 'Internal server error',
          content: { 'application/json': { schema: ERROR_SCHEMA_JSON } },
        }
      }

      transformedPathItem[method] = { ...op, responses: transformedResponses }
    }

    transformedPaths[pathKey] = transformedPathItem
  }

  return { ...spec, paths: transformedPaths }
}

export function response() {
  return new Elysia({ name: 'response-plugin' })
    .model({ 'common.error': errorSchema })
    .onError({ as: 'global' }, ({ code, error, request, set }) => {
      const pathname = new URL(request.url).pathname
      if (pathname.startsWith('/scalar'))
        throw error
      const mapping: ErrorMapping = resolveErrorMapping(code)
      set.status = mapping.statusCode
      return createErrorResponse(mapping.businessCode, getErrorMessage(error, mapping.defaultMessage))
    })
    .mapResponse({ as: 'global' }, ({ request, set, responseValue }) => {
      // Intercept OpenAPI spec and wrap all 2xx response schemas with success envelope
      if (isOpenApiSpec(responseValue)) {
        const transformed = transformOpenApiSpec(responseValue as Record<string, unknown>)
        return new Response(JSON.stringify(transformed), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const pathname = new URL(request.url).pathname
      if (pathname.startsWith('/scalar'))
        return

      if (isResponseEnvelope(responseValue))
        return

      const wrapped = createSuccessResponse(responseValue)
      return new Response(JSON.stringify(wrapped), {
        headers: { 'Content-Type': 'application/json' },
        status: typeof set.status === 'number' ? set.status : 200,
      })
    })
}
