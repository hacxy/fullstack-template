import process from 'node:process'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { Elysia } from 'elysia'
import { response } from 'elysia-response'
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
        { url: `http://localhost:${process.env.PORT ?? 3000}`, description: 'Local development server' },
        ...(process.env.SERVER_URL ? [{ url: process.env.SERVER_URL, description: 'Production server' }] : []),
      ],
    },
  }))
  .use(userController)

export type App = typeof app
