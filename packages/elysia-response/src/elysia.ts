import type { DocumentDecoration } from 'elysia'
import { Elysia, t } from 'elysia'
import {
  BusinessError,
  DEFAULT_ERROR_MAPPING,
  createErrorResponse,
  createSuccessResponse,
  isResponseEnvelope,
  resolveErrorMapping,
} from './contract.js'

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface ResponseOptions {
  filterNull?: boolean
}

const errorSchema = t.Object({
  code: t.Number({ description: 'Business error code for failed requests' }),
  msg: t.String({ description: 'Human readable error message' }),
})

const ERROR_SCHEMA_JSON = {
  type: 'object' as const,
  required: ['code', 'msg'],
  properties: {
    code: { type: 'integer' as const, description: 'Business error code for failed requests' },
    msg: { type: 'string' as const, description: 'Human readable error message' },
  },
}

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const

const ERROR_STATUS_DESCRIPTIONS: Record<string, string> = {
  '400': 'Bad request',
  '404': 'Not found',
  '422': 'Unprocessable entity',
  '500': 'Internal server error',
}

const DEFAULT_ERROR_STATUS_CODES = [
  ...new Set(Object.values(DEFAULT_ERROR_MAPPING).map(m => String(m.statusCode))),
].sort()

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0) {
      // Raw Elysia internal codes ("NOT_FOUND", "INTERNAL_SERVER_ERROR") or generic HTTP text ("Bad Request") → use fallback
      if (/^[A-Z][A-Z_]+$/.test(maybeMessage) || maybeMessage === 'Bad Request')
        return fallback
      // ValidationError emits a JSON string — extract the human-readable summary
      if (maybeMessage.startsWith('{')) {
        try {
          const parsed = JSON.parse(maybeMessage) as Record<string, unknown>
          if (typeof parsed.summary === 'string' && parsed.summary.length > 0)
            return parsed.summary
        }
        catch {}
        return fallback
      }
      return maybeMessage
    }
  }
  return fallback
}

function isOpenApiSpec(value: unknown): boolean {
  if (!value || typeof value !== 'object')
    return false
  const obj = value as Record<string, unknown>
  return typeof obj.openapi === 'string' && !!obj.paths && !!obj.info
}

function resolveRef(schema: unknown, spec: Record<string, unknown>): unknown {
  if (!schema || typeof schema !== 'object') return schema
  const s = schema as Record<string, unknown>
  if (typeof s.$ref !== 'string') return schema
  const parts = s.$ref.replace(/^#\//, '').split('/')
  let resolved: unknown = spec
  for (const part of parts) {
    if (!resolved || typeof resolved !== 'object') return schema
    resolved = (resolved as Record<string, unknown>)[part]
  }
  return resolved
}

function isVoidSchema(schema: unknown): boolean {
  if (schema === null || schema === undefined) return true
  if (typeof schema === 'object') {
    const s = schema as Record<string, unknown>
    return s.type === 'undefined'
  }
  return false
}

function isNullSchema(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return false
  return (schema as Record<string, unknown>).type === 'null'
}

function isNullableSchema(schema: unknown): boolean {
  if (!schema || typeof schema !== 'object') return false
  const s = schema as Record<string, unknown>
  if (s.type === 'null') return false
  if (Array.isArray(s.type) && (s.type as string[]).includes('null')) return true
  if (s.nullable === true) return true
  if (Array.isArray(s.anyOf)) {
    return (s.anyOf as unknown[]).some(
      t => typeof t === 'object' && t !== null && (t as Record<string, unknown>).type === 'null',
    )
  }
  return false
}

function makeNullableFieldsOptional(schema: unknown): unknown {
  if (!schema || typeof schema !== 'object') return schema
  const s = schema as Record<string, unknown>
  if (s.type !== 'object' || !s.properties) return schema
  const properties = s.properties as Record<string, unknown>
  const required = Array.isArray(s.required) ? (s.required as string[]) : []

  // t.Null() fields are always filtered at runtime → remove from properties entirely
  const newProperties: Record<string, unknown> = Object.fromEntries(
    Object.entries(properties).filter(([, v]) => !isNullSchema(v)),
  )
  // t.Nullable(X) fields may be null at runtime → keep in properties but remove from required
  const newRequired = required.filter(
    key => !isNullableSchema(properties[key]) && !isNullSchema(properties[key]),
  )

  const propertiesChanged = Object.keys(newProperties).length !== Object.keys(properties).length
  const requiredChanged = newRequired.length !== required.length
  if (!propertiesChanged && !requiredChanged) return schema

  const result: Record<string, unknown> = { ...s, required: newRequired, properties: newProperties }
  delete result.$id
  return result
}

function wrapSuccessSchema(
  schema: unknown,
  isVoid: boolean,
  filterNull = false,
  resolvedSchema: unknown = schema,
): object {
  const codeSchema = { type: 'integer', const: 0, description: 'Business code: 0 means success' }
  const msgSchema = { type: 'string', description: 'Business message for successful response' }

  if (isVoid || (filterNull && isNullSchema(resolvedSchema))) {
    return {
      type: 'object',
      required: ['code', 'msg'],
      properties: { code: codeSchema, msg: msgSchema },
    }
  }

  if (filterNull && isNullableSchema(resolvedSchema)) {
    return {
      type: 'object',
      required: ['code', 'msg'],
      properties: { code: codeSchema, msg: msgSchema, data: schema },
    }
  }

  const dataSchema = filterNull ? makeNullableFieldsOptional(resolvedSchema) : schema
  return {
    type: 'object',
    required: ['code', 'msg', 'data'],
    properties: { code: codeSchema, msg: msgSchema, data: dataSchema },
  }
}

function transformOpenApiSpec(spec: Record<string, unknown>, filterNull: boolean): Record<string, unknown> {
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

        const resolvedSchema = resolveRef(jsonContent.schema, spec)
        transformedResponses[statusCode] = {
          ...responseObj,
          content: {
            ...content,
            'application/json': {
              ...jsonContent,
              schema: wrapSuccessSchema(jsonContent.schema, isVoidSchema(resolvedSchema), filterNull, resolvedSchema),
            },
          },
        }
      }

      for (const statusCode of DEFAULT_ERROR_STATUS_CODES) {
        if (!transformedResponses[statusCode]) {
          transformedResponses[statusCode] = {
            description: ERROR_STATUS_DESCRIPTIONS[statusCode] ?? 'Error',
            content: { 'application/json': { schema: ERROR_SCHEMA_JSON } },
          }
        }
      }

      const security = op.security as unknown[] | undefined
      const hasBearerAuth = security?.some(s => Array.isArray((s as Record<string, unknown>).BearerAuth))
      if (hasBearerAuth && !transformedResponses['401']) {
        transformedResponses['401'] = {
          description: 'Unauthorized',
          content: { 'application/json': { schema: ERROR_SCHEMA_JSON } },
        }
      }

      type BusinessErrorEntry = { statusCode: number, description: string }
      const businessErrors = op['x-business-errors'] as BusinessErrorEntry[] | undefined
      if (businessErrors?.length) {
        const grouped = new Map<string, string[]>()
        for (const e of businessErrors) {
          const key = String(e.statusCode)
          const msgs = grouped.get(key) ?? []
          if (e.description)
            msgs.push(e.description)
          grouped.set(key, msgs)
        }
        for (const [key, msgs] of grouped) {
          transformedResponses[key] = {
            description: msgs.join(' / ') || 'Error',
            content: { 'application/json': { schema: ERROR_SCHEMA_JSON } },
          }
        }
      }

      const { 'x-business-errors': _xbe, ...cleanOp } = op
      transformedPathItem[method] = { ...cleanOp, responses: transformedResponses }
    }

    transformedPaths[pathKey] = transformedPathItem
  }

  return { ...spec, paths: transformedPaths }
}

export function buildErrorResponses(list: BusinessError[]) {
  const grouped = new Map<string, string[]>()
  for (const e of list) {
    const key = String(e.statusCode)
    const msgs = grouped.get(key) ?? []
    if (e.message)
      msgs.push(e.message)
    grouped.set(key, msgs)
  }
  return Object.fromEntries(
    [...grouped.entries()].map(([status, msgs]) => [status, {
      description: msgs.join(' / ') || 'Error',
      content: { 'application/json': { schema: ERROR_SCHEMA_JSON } },
    }]),
  )
}

export function response(options: ResponseOptions = {}) {
  const { filterNull = false } = options

  return new Elysia({ name: 'response-plugin' })
    .macro({
      errors(list: BusinessError[]) {
        return {
          detail: {
            'x-business-errors': list.map(e => ({ statusCode: e.statusCode, description: e.message || 'Error' })),
          } as unknown as DocumentDecoration,
        }
      },
    })
    .model({ 'common.error': errorSchema })
    .onError({ as: 'global' }, ({ code, error, request, set }) => {
      const accept = request.headers.get('accept') ?? ''
      if (accept.includes('text/html') && !accept.includes('application/json'))
        throw error
      if (error instanceof BusinessError) {
        set.status = error.statusCode
        return createErrorResponse(error.businessCode, error.message || '')
      }
      const mapping = resolveErrorMapping(code)
      set.status = mapping.statusCode
      return createErrorResponse(mapping.businessCode, getErrorMessage(error, mapping.defaultMessage))
    })
    .mapResponse({ as: 'global' }, ({ set, responseValue }) => {
      // Intercept OpenAPI spec and wrap all 2xx response schemas with success envelope
      if (isOpenApiSpec(responseValue)) {
        const transformed = transformOpenApiSpec(responseValue as Record<string, unknown>, filterNull)
        return new Response(JSON.stringify(transformed), {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const contentType = (set.headers as Record<string, string | undefined>)?.['content-type'] ?? ''
      if (contentType && !contentType.includes('application/json'))
        return

      if (isResponseEnvelope(responseValue))
        return

      if (filterNull) {
        const httpStatus = typeof set.status === 'number' ? set.status : 200
        if (responseValue === null) {
          return new Response(JSON.stringify({ code: 0, msg: 'ok' }), {
            headers: { 'Content-Type': 'application/json' },
            status: httpStatus,
          })
        }
        if (responseValue && typeof responseValue === 'object' && !Array.isArray(responseValue)) {
          const filtered = Object.fromEntries(
            Object.entries(responseValue as Record<string, unknown>).filter(([, v]) => v !== null),
          )
          return new Response(JSON.stringify(createSuccessResponse(filtered)), {
            headers: { 'Content-Type': 'application/json' },
            status: httpStatus,
          })
        }
      }

      const wrapped = createSuccessResponse(responseValue)
      return new Response(JSON.stringify(wrapped), {
        headers: { 'Content-Type': 'application/json' },
        status: typeof set.status === 'number' ? set.status : 200,
      })
    })
}
