import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'

const mockFrom = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: mockFrom }),
  },
}))

mock.module('@elysiajs/jwt', () => ({
  jwt: (opts: any) => new Elysia().decorate(opts?.name ?? 'jwt', {
    sign: async () => 'mock-token',
    verify: async (token: string) => token ? { sub: '1', email: 'test@test.com' } : false,
  }),
}))

const { app } = await import('../../src/app.js')

const mockUsers = [
  { id: 1, name: 'Alice', email: 'alice@test.com', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Bob', email: 'bob@test.com', createdAt: new Date('2024-01-02') },
]

describe('GET /api/users', () => {
  beforeEach(() => {
    mockFrom.mockReset()
  })

  it('returns 200 with user list', async () => {
    mockFrom.mockResolvedValue(mockUsers)

    const res = await app.handle(
      new Request('http://localhost/api/users/'),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(0)
    expect(body.msg).toBe('ok')
    expect(body.data).toHaveLength(2)
    expect(body.data[0].name).toBe('Alice')
    expect(body.data[0].email).toBe('alice@test.com')
  })

  it('returns 200 with empty array when no users', async () => {
    mockFrom.mockResolvedValue([])

    const res = await app.handle(
      new Request('http://localhost/api/users/'),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(0)
    expect(body.data).toEqual([])
  })
})

describe('GET /api/users/test', () => {
  it('returns 401 when no token', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/users/test'),
    )

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe(2001)
  })

  it('returns 200 with success envelope when authenticated', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/users/test', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(0)
    expect(body.msg).toBe('ok')
  })
})
