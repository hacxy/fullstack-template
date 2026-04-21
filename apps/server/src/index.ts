import { swagger } from '@elysiajs/swagger'
import consola from 'consola'
import { Elysia } from 'elysia'
import { userController } from './controllers/userController'

export const app = new Elysia()
  .use(swagger({
    path: '/scalar',
    documentation: {
      info: {
        title: 'Fullstack Template API',
        version: '1.0.0',
        description: 'RESTful API for the fullstack template project',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local development server' },
      ],
    },
  }))
  .use(userController)
  .listen(3000, ({ hostname, port }) => {
    consola.success(`Server running at http://${hostname}:${port}`)
  })
export type App = typeof app
