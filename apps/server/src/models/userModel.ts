import { Elysia, t } from 'elysia'

export const UserModel = new Elysia()
  .model({
    'user.create': t.Object({
      name: t.String({ description: 'User name', minLength: 1 }),
    }),
    'user.item': t.Object({
      id: t.Number({ description: 'User ID' }),
      name: t.String({ description: 'User name' }),
      foo: t.Optional(t.String()),
      createdAt: t.Date({ description: 'Creation date' }),
    }),
    'user.list': t.Array(
      t.Object({
        id: t.Number({ description: 'User ID' }),
        name: t.String({ description: 'User name' }),
        createdAt: t.Date({ description: 'Creation date' }),
      }),
    ),
  })
