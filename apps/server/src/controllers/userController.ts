import { Elysia } from 'elysia'
import { UserModel } from '../models/userModel.js'
import { UserService } from '../services/userService.js'

export const userController = new Elysia({ prefix: '/api/users' })
  .use(UserModel)
  .get('/', () => UserService.findAll(), {
    response: 'user.list',
    detail: {
      tags: ['Users'],
      summary: 'Get all users',
      description: 'Returns a list of all users in the database',
    },
  })
  .post('/', ({ body }) => UserService.create(body), {
    body: 'user.create',
    detail: {
      tags: ['Users'],
      summary: 'Create a user',
      description: 'Creates a new user and returns the created record',
    },
    response: 'user.item',
  })
