import { Elysia, t } from 'elysia'

const userItemSchema = t.Object({
  id: t.Number({ description: 'User ID' }),
  name: t.String({ description: 'User name' }),
  email: t.String({ description: 'User email' }),
  createdAt: t.Date({ description: 'Creation date' }),
})

export const UserModel = new Elysia()
  .model({
    'user.item': userItemSchema,
    'user.list': t.Array(userItemSchema),
    'user.test': t.Object({
      name: t.String(),
      foo: t.Null(),
    }),
  })
