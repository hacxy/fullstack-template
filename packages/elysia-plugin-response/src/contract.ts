export interface ErrorMapping {
  businessCode: number
  statusCode: number
  defaultMessage: string
}

export type ErrorMappingTable = Record<string, ErrorMapping>

export const DEFAULT_ERROR_KEY = 'INTERNAL_SERVER_ERROR'

export const DEFAULT_ERROR_MAPPING: ErrorMappingTable = {
  VALIDATION: {
    businessCode: 1001,
    statusCode: 422,
    defaultMessage: 'Request validation failed',
  },
  NOT_FOUND: {
    businessCode: 1004,
    statusCode: 404,
    defaultMessage: 'Resource not found',
  },
  PARSE: {
    businessCode: 1002,
    statusCode: 400,
    defaultMessage: 'Request payload parse failed',
  },
  INTERNAL_SERVER_ERROR: {
    businessCode: 1500,
    statusCode: 500,
    defaultMessage: 'Internal server error',
  },
}

export interface ResponseContractOptions<TSchema = never, TDataSchema = never> {
  buildSuccess?: (input: { data: unknown, message: string }) => unknown
  buildError?: (input: { code: number, message: string }) => unknown
  isEnvelope?: (payload: unknown) => boolean
  errorMapping?: Partial<Record<string, Partial<ErrorMapping>>>
  defaultErrorKey?: string
  createSuccessSchema?: (dataSchema: TDataSchema) => TSchema
  createErrorSchema?: () => TSchema
}

export interface ResponseContract<TSchema = never, TDataSchema = never> {
  createSuccessResponse: <TData>(data: TData, message?: string) => unknown
  createErrorResponse: (code: number, message: string) => unknown
  isResponseEnvelope: (payload: unknown) => boolean
  resolveErrorMapping: (contextCode: string | number) => ErrorMapping
  createSuccessResponseSchema: (dataSchema: TDataSchema) => TSchema
  createErrorResponseSchema: () => TSchema
}

function defaultIsEnvelope(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object')
    return false

  const target = payload as Record<string, unknown>
  return typeof target.code === 'number'
    && typeof target.msg === 'string'
    && 'data' in target
}

function mergeErrorMapping(overrides: Partial<Record<string, Partial<ErrorMapping>>> = {}): ErrorMappingTable {
  const entries = Object.entries(DEFAULT_ERROR_MAPPING)
  const merged = Object.fromEntries(entries.map(([key, value]) => [key, { ...value }])) as ErrorMappingTable

  Object.entries(overrides).forEach(([key, override]) => {
    const base = merged[key] ?? merged[DEFAULT_ERROR_KEY]
    merged[key] = { ...base, ...override }
  })

  return merged
}

export function createResponseContract<TSchema = never, TDataSchema = never>(
  options: ResponseContractOptions<TSchema, TDataSchema> = {},
): ResponseContract<TSchema, TDataSchema> {
  const buildSuccess = options.buildSuccess ?? ((input: { data: unknown, message: string }) => ({
    code: 0,
    msg: input.message,
    data: input.data,
  }))

  const buildError = options.buildError ?? ((input: { code: number, message: string }) => ({
    code: input.code,
    msg: input.message,
    data: null,
  }))

  const isEnvelope = options.isEnvelope ?? defaultIsEnvelope
  const mappingTable = mergeErrorMapping(options.errorMapping)
  const defaultErrorKey = options.defaultErrorKey ?? DEFAULT_ERROR_KEY
  const defaultMapping = mappingTable[defaultErrorKey] ?? DEFAULT_ERROR_MAPPING[DEFAULT_ERROR_KEY]
  const createSuccessSchema = options.createSuccessSchema
  const createErrorSchema = options.createErrorSchema

  return {
    createSuccessResponse: (data, message = 'ok') => buildSuccess({ data, message }),
    createErrorResponse: (code, message) => buildError({ code, message }),
    isResponseEnvelope: payload => isEnvelope(payload),
    resolveErrorMapping: (contextCode) => {
      if (typeof contextCode !== 'string')
        return defaultMapping

      return mappingTable[contextCode] ?? defaultMapping
    },
    createSuccessResponseSchema: (dataSchema) => {
      if (!createSuccessSchema)
        throw new Error('Missing success schema factory. Please configure createSuccessSchema in createResponseContract options.')
      return createSuccessSchema(dataSchema)
    },
    createErrorResponseSchema: () => {
      if (!createErrorSchema)
        throw new Error('Missing error schema factory. Please configure createErrorSchema in createResponseContract options.')
      return createErrorSchema()
    },
  }
}
