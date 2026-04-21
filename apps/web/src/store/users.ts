import type { User } from '../services'
import { userApi } from '../services'
import { createStore } from './createStore'

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
    const users = await userApi.getAll()
    set({ users, loading: false })
  },
  addUser: async (name) => {
    const user = await userApi.create({ name })
    set(state => ({ users: [...state.users, user] }))
  },
}))
