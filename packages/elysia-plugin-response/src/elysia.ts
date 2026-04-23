import { Elysia, t } from 'elysia'
import {
  createResponseContract,
  type ErrorMapping,
  type ResponseContractOptions,
} from './contract.js'

type SchemaLike = Parameters<typeof t.Array>[0]

export interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

const DEFAULT_DESCRIPTIONS = {
  successCode: 'Business code: 0 means success',
  successMsg: 'Business message for successful response',
  errorCode: 'Business error code for failed requests',
  errorMsg: 'Human readable error message',
  errorData: 'Always null for current error payloads',
}

type EnvelopeMapper = {
  code: string
  message: string
  data: string
}

export interface ElysiaResponseOptions extends Omit<
  ResponseContractOptions<SchemaLike, SchemaLike>,
  'createSuccessSchema' | 'createErrorSchema' | 'buildSuccess' | 'buildError' | 'isEnvelope'
> {
  descriptions?: Partial<typeof DEFAULT_DESCRIPTIONS>
  envelope?: Partial<EnvelopeMapper>
  successCodeValue?: number
}

export interface ElysiaResponseKit {
  contract: ReturnType<typeof createElysiaResponseContract>
  plugin: ReturnType<typeof response>
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message
    if (typeof maybeMessage === 'string' && maybeMessage.length > 0)
      return maybeMessage
  }

  return fallback
}

function createEnvelopeBuilders(mapper: EnvelopeMapper, successCodeValue: number) {
  return {
    buildSuccess: (input: { data: unknown, message: string }) => ({
      [mapper.code]: successCodeValue,
      [mapper.message]: input.message,
      [mapper.data]: input.data,
    }),
    buildError: (input: { code: number, message: string }) => ({
      [mapper.code]: input.code,
      [mapper.message]: input.message,
      [mapper.data]: null,
    }),
    isEnvelope: (payload: unknown) => {
      if (!payload || typeof payload !== 'object')
        return false

      const target = payload as Record<string, unknown>
      return typeof target[mapper.code] === 'number'
        && typeof target[mapper.message] === 'string'
        && mapper.data in target
    },
  }
}

function createSchemaConfig(
  mapper: EnvelopeMapper,
  successCodeValue: number,
  descriptions?: Partial<typeof DEFAULT_DESCRIPTIONS>,
) {
  const mergedDescription = { ...DEFAULT_DESCRIPTIONS, ...descriptions }

  return {
    createErrorSchema: () => t.Object({
      [mapper.code]: t.Number({ description: mergedDescription.errorCode }),
      [mapper.message]: t.String({ description: mergedDescription.errorMsg }),
      [mapper.data]: t.Null({ description: mergedDescription.errorData }),
    }),
    createSuccessSchema: (dataSchema: SchemaLike) => t.Object({
      [mapper.code]: t.Literal(successCodeValue, { description: mergedDescription.successCode }),
      [mapper.message]: t.String({ description: mergedDescription.successMsg }),
      [mapper.data]: dataSchema,
    }),
  }
}

export function createElysiaResponseContract(options: ElysiaResponseOptions = {}) {
  const mapper: EnvelopeMapper = {
    code: options.envelope?.code ?? 'code',
    message: options.envelope?.message ?? 'msg',
    data: options.envelope?.data ?? 'data',
  }

  const successCodeValue = options.successCodeValue ?? 0
  const descriptions = options.descriptions
  const contractOptions: Pick<ResponseContractOptions<SchemaLike, SchemaLike>, 'errorMapping' | 'defaultErrorKey'> = {
    errorMapping: options.errorMapping,
    defaultErrorKey: options.defaultErrorKey,
  }

  return createResponseContract<SchemaLike, SchemaLike>({
    ...contractOptions,
    ...createEnvelopeBuilders(mapper, successCodeValue),
    ...createSchemaConfig(mapper, successCodeValue, descriptions),
  })
}

export const responseContract = createElysiaResponseContract()

export function response(options: ElysiaResponseOptions = {}) {
  const contract = createElysiaResponseContract(options)

  return new Elysia({ name: 'response-plugin' })
    .onAfterHandle({ as: 'global' }, ({ request, response }) => {
      const pathname = new URL(request.url).pathname
      if (pathname.startsWith('/scalar'))
        return response

      if (contract.isResponseEnvelope(response))
        return response

      return contract.createSuccessResponse(response)
    })
    .onError({ as: 'global' }, ({ code, error, request, set }) => {
      const pathname = new URL(request.url).pathname
      if (pathname.startsWith('/scalar'))
        throw error

      const mapping: ErrorMapping = contract.resolveErrorMapping(code)
      set.status = mapping.statusCode

      return contract.createErrorResponse(
        mapping.businessCode,
        getErrorMessage(error, mapping.defaultMessage),
      )
    })
}

export function createElysiaResponseKit(options: ElysiaResponseOptions = {}): ElysiaResponseKit {
  const contract = createElysiaResponseContract(options)

  return {
    contract,
    plugin: response(options),
  }
}
