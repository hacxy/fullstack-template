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
    'common.error': {
      /** @description Business error code for failed requests */
      code: number
      /** @description Human readable error message */
      msg: string
      /** @description Always null for current error payloads */
      data: null
    }
    'user.responseItem': {
      /**
       * @description Business code: 0 means success
       * @constant
       */
      code: 0
      /** @description Business message for successful response */
      msg: string
      data: {
        /** @description User ID */
        id: number
        /** @description User name */
        name: string
        /** @description Creation date */
        createdAt: Record<string, never> | string | number
      }
    }
    'user.responseList': {
      /**
       * @description Business code: 0 means success
       * @constant
       */
      code: 0
      /** @description Business message for successful response */
      msg: string
      data: {
        /** @description User ID */
        id: number
        /** @description User name */
        name: string
        /** @description Creation date */
        createdAt: Record<string, never> | string | number
      }[]
    }
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
          'application/json': components['schemas']['user.responseList']
          'multipart/form-data': components['schemas']['user.responseList']
          'text/plain': components['schemas']['user.responseList']
        }
      }
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
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
          'application/json': components['schemas']['user.responseItem']
          'multipart/form-data': components['schemas']['user.responseItem']
          'text/plain': components['schemas']['user.responseItem']
        }
      }
      400: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
      404: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
      500: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['common.error']
          'multipart/form-data': components['schemas']['common.error']
          'text/plain': components['schemas']['common.error']
        }
      }
    }
  }
}
