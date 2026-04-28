import { Elysia } from 'elysia'
import { jwtGuard } from '@/plugins/jwtGuard.js'
import { UserModel } from '../models/userModel.js'
import { UserService } from '../services/userService.js'

export const userController = new Elysia({ prefix: '/api/users' })
  .use(UserModel)
  .use(jwtGuard)
  .get('/', async () => {
    return UserService.findAll()
  }, {
    response: { 200: 'user.list' },
    detail: {
      tags: ['Users'],
      summary: 'Get all users',
      description: 'Returns a list of all users in the database',
    },
  })
  .get('/test', () => {
    return {
      name: 'hacxy',
      foo: null,
    }
  }, {
    auth: true,
    response: {
      200: 'user.test',
    },
    detail: {
      tags: ['Users'],
      summary: 'Test response',
    },
  })
