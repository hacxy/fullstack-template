import type { components } from '../services'
import { client, getApiErrorMessage, unwrapApiResponse } from '../services'
import { createStore } from './createStore'

type User = components['schemas']['user.item']
type UserListEnvelope = components['schemas']['user.responseList']
type UserItemEnvelope = components['schemas']['user.responseItem']

interface UsersStore {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
  addUser: (name: string) => Promise<void>
}

export const useUsersStore = createStore<UsersStore>('UsersStore', set => ({
  users: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true })
    const { data, error } = await client.GET('/api/users/')
    if (error) {
      set({ loading: false })
      throw new Error(getApiErrorMessage(error))
    }

    set({
      users: unwrapApiResponse((data as UserListEnvelope)),
      loading: false,
    })
  },
  addUser: async (name) => {
    const { data, error } = await client.POST('/api/users/', { body: { name } })
    if (error)
      throw new Error(getApiErrorMessage(error))

    const createdUser = unwrapApiResponse((data as UserItemEnvelope))
    set(state => ({ users: [...state.users, createdUser] }))
  },
}))
