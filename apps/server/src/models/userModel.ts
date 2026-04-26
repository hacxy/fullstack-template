import { Elysia, t } from 'elysia'

const userItemSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'User name' }),
  createdAt: t.Date({ description: 'Creation date' }),
})

export const UserModel = new Elysia()
  .model({
    'user.create': t.Object({
      name: t.String({ description: 'User name', minLength: 1 }),
    }),
    'user.item': userItemSchema,
    'user.list': t.Array(userItemSchema),
    'user.test': t.Undefined(),
  })
