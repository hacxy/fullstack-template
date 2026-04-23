import type { components, paths } from './schema.gen'
import createClient from 'openapi-fetch'

type SchemaMap = components['schemas']
type EnvelopeSchemaName = Extract<keyof SchemaMap, `${string}.response${string}`>

export type ApiEnvelope = SchemaMap[EnvelopeSchemaName]

export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

export function unwrapApiResponse<TEnvelope extends ApiEnvelope>(payload: TEnvelope): TEnvelope['data'] {
  if (payload.code !== 0)
    throw new Error(payload.msg || 'Request failed')

  return payload.data
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const envelope = error as Partial<Pick<ApiEnvelope, 'msg'>>
    if (typeof envelope.msg === 'string' && envelope.msg.length > 0)
      return envelope.msg
  }

  return 'Request failed'
}
