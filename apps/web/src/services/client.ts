import type { paths } from './schema.gen'
import createClient from 'openapi-fetch'

export interface ApiEnvelope<T> {
  code: number
  msg: string
  data: T
}

export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})

export function unwrapApiResponse<T>(payload: ApiEnvelope<T>): T {
  if (payload.code !== 0)
    throw new Error(payload.msg || 'Request failed')

  return payload.data
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const envelope = error as Partial<ApiEnvelope<unknown>>
    if (typeof envelope.msg === 'string' && envelope.msg.length > 0)
      return envelope.msg
  }

  return 'Request failed'
}
