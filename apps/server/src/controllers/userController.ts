import { Elysia } from 'elysia'
import { UserModel } from '../models/userModel.js'
import { UserService } from '../services/userService.js'

export const userController = new Elysia({ prefix: '/api/users' })
  .use(UserModel)
  .get('/', async () => {
    return UserService.findAll()
  }, {
    response: {
      200: 'user.responseList',
      400: 'common.error',
      404: 'common.error',
      422: 'common.error',
      500: 'common.error',
    },
    detail: {
      tags: ['Users'],
      summary: 'Get all users',
      description: 'Returns a list of all users in the database',
    },
  })
  .post('/', async ({ body }) => {
    return UserService.create(body)
  }, {
    body: 'user.create',
    detail: {
      tags: ['Users'],
      summary: 'Create a user',
      description: 'Creates a new user and returns the created record',
    },
    response: {
      200: 'user.responseItem',
      400: 'common.error',
      404: 'common.error',
      422: 'common.error',
      500: 'common.error',
    },
  })
