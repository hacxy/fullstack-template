import { Elysia } from 'elysia'
import { errors } from '../errors.js'
import { AuthModel } from '../models/authModel.js'
import { jwtGuard } from '../plugins/jwtGuard.js'
import { AuthService } from '../services/authService.js'

export const authController = new Elysia({ prefix: '/api/auth' })
  .use(AuthModel)
  .use(jwtGuard)
  .post('/login', async ({ body, jwt }) => {
    const user = await AuthService.login(body)
    const token = await jwt.sign({ sub: String(user.id), email: user.email })
    return { token }
  }, {
    errors: [errors.AUTH_UNAUTHORIZED],
    body: 'auth.login',
    response: { 200: 'auth.token' },
    detail: { tags: ['Auth'], summary: 'Login' },
  })
  .post('/register', async ({ body, jwt }) => {
    const user = await AuthService.register(body)
    const token = await jwt.sign({ sub: String(user.id), email: user.email })
    return { token }
  }, {
    errors: [errors.AUTH_CONFLICT],
    body: 'auth.register',
    response: { 200: 'auth.token' },
    detail: { tags: ['Auth'], summary: 'Register' },
  })
