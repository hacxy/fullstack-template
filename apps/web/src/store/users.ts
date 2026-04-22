import type { components } from '../services'
import { client } from '../services'
import { createStore } from './createStore'

type User = components['schemas']['user.item']

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
    if (error)
      throw error
    set({ users: data, loading: false })
  },
  addUser: async (name) => {
    const { data, error } = await client.POST('/api/users/', { body: { name } })
    if (error)
      throw error
    set(state => ({ users: [...state.users, data] }))
  },
}))
