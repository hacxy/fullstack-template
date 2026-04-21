import type { StateCreator } from 'zustand'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export function createStore<T>(name: string, initializer: StateCreator<T, [], []>) {
  return create<T>()(
    devtools(initializer, { name, enabled: import.meta.env.DEV }),
  )
}
