// This file is auto-generated. Do not edit manually.
export interface paths {
  '/api/users/': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get all users
     * @description Returns a list of all users in the database
     */
    get: operations['getApiUsers']
    put?: never
    /**
     * Create a user
     * @description Creates a new user and returns the created record
     */
    post: operations['postApiUsers']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    'user.create': {
      /** @description User name */
      name: string
    }
    'user.item': {
      /** @description User ID */
      id: number
      /** @description User name */
      name: string
      foo?: string
      /** @description Creation date */
      createdAt: Record<string, never> | string | number
    }
    'user.list': {
      /** @description User ID */
      id: number
      /** @description User name */
      name: string
      /** @description Creation date */
      createdAt: Record<string, never> | string | number
    }[]
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  getApiUsers: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['user.list']
          'multipart/form-data': components['schemas']['user.list']
          'text/plain': components['schemas']['user.list']
        }
      }
    }
  }
  postApiUsers: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['user.create']
        'multipart/form-data': components['schemas']['user.create']
        'text/plain': components['schemas']['user.create']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['user.item']
          'multipart/form-data': components['schemas']['user.item']
          'text/plain': components['schemas']['user.item']
        }
      }
    }
  }
}
