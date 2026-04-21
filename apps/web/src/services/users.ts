import type { components } from './schema.gen'
import { client } from './client'

export type User = components['schemas']['user.item']
export type CreateUserBody = components['schemas']['user.create']

export const userApi = {
  getAll: () => client.get('api/users/').json<User[]>(),
  create: (body: CreateUserBody) => client.post('api/users/', { json: body }).json<User>(),
}
