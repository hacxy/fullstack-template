import process from 'node:process'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { response } from 'elysia-response'
import { authController } from './controllers/authController.js'
import { userController } from './controllers/userController.js'

export const app = new Elysia()
  .use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }))
  .use(response({ filterNull: true }))
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
        ...(process.env.SERVER_URL ? [{ url: process.env.SERVER_URL, description: 'Production server' }] : []),
        { url: `http://localhost:${process.env.PORT ?? 3000}`, description: 'Local development server' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  }))
  .use(authController)
  .use(userController)

export type App = typeof app
