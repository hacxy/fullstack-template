import { Elysia, t } from 'elysia'

export const UserModel = new Elysia()
  .model({
    'user.create': t.Object({
      name: t.String({ description: 'User name', minLength: 1 }),
    }),
    'user.response': t.Object({
      id: t.Number({ description: 'User ID' }),
      name: t.String({ description: 'User name' }),
      createdAt: t.Date({ description: 'Creation date' }),
    }),
  })
