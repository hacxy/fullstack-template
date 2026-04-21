import ky from 'ky'

export const client = ky.create({
  prefix: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
})
