import process from 'node:process'
import { jwt } from '@elysiajs/jwt'
import { Elysia } from 'elysia'
import { errors } from '../errors.js'

export const jwtGuard = new Elysia({ name: 'jwt-guard' })
  .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET!, exp: '7d' }))
  .macro({
    auth(enabled: boolean) {
      if (!enabled)
        return
      return {
        async beforeHandle({ jwt, headers }: any) {
          const token = headers.authorization?.split(' ')[1]
          if (!token)
            throw errors.TOKEN_MISSING
          const payload = await jwt.verify(token)
          if (!payload)
            throw errors.TOKEN_INVALID
        },
        detail: {
          security: [{ BearerAuth: [] }],
        },
      }
    },
  })
