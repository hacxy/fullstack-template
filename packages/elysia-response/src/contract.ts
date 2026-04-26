export interface ErrorMapping {
  businessCode: number
  statusCode: number
  defaultMessage: string
}

const ERROR_MAPPING: Record<string, ErrorMapping> = {
  VALIDATION: { businessCode: 1001, statusCode: 422, defaultMessage: 'Request validation failed' },
  NOT_FOUND: { businessCode: 1004, statusCode: 404, defaultMessage: 'Resource not found' },
  PARSE: { businessCode: 1002, statusCode: 400, defaultMessage: 'Request payload parse failed' },
  INTERNAL_SERVER_ERROR: { businessCode: 1500, statusCode: 500, defaultMessage: 'Internal server error' },
}

export function createSuccessResponse<T>(data: T, message = 'ok') {
  return { code: 0 as const, msg: message, data }
}

export function createErrorResponse(code: number, message: string) {
  return { code, msg: message }
}

export function isResponseEnvelope(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object')
    return false
  const target = payload as Record<string, unknown>
  return typeof target.code === 'number' && typeof target.msg === 'string'
}

export function resolveErrorMapping(contextCode: string | number): ErrorMapping {
  if (typeof contextCode !== 'string')
    return ERROR_MAPPING.INTERNAL_SERVER_ERROR
  return ERROR_MAPPING[contextCode] ?? ERROR_MAPPING.INTERNAL_SERVER_ERROR
}
