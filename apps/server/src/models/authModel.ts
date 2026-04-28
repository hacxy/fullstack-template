import { Elysia, t } from 'elysia'

export const AuthModel = new Elysia()
  .model({
    'auth.login': t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
    }),
    'auth.register': t.Object({
      name: t.String({ minLength: 1 }),
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
    }),
    'auth.token': t.Object({
      token: t.String(),
    }),
  })
