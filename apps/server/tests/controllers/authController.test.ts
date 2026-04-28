import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { Elysia } from 'elysia'

const mockWhere = mock()
const mockReturning = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: mockWhere }) }),
    insert: () => ({ values: () => ({ returning: mockReturning }) }),
  },
}))

mock.module('@elysiajs/jwt', () => ({
  jwt: (opts: any) => new Elysia().decorate(opts?.name ?? 'jwt', {
    sign: async () => 'mock-token',
    verify: async (token: string) => token ? { sub: '1', email: 'test@test.com' } : false,
  }),
}))

const { app } = await import('../../src/app.js')

const PASSWORD_HASH = await Bun.password.hash('password123')

const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@test.com',
  passwordHash: PASSWORD_HASH,
  createdAt: new Date(),
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    mockWhere.mockReset()
    mockReturning.mockReset()
  })

  it('returns 200 with token on success', async () => {
    mockWhere.mockResolvedValue([])
    mockReturning.mockResolvedValue([mockUser])

    const res = await app.handle(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'password123' }),
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(0)
    expect(body.data.token).toBe('mock-token')
  })

  it('returns 409 when email already registered', async () => {
    mockWhere.mockResolvedValue([mockUser])

    const res = await app.handle(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Alice', email: 'alice@test.com', password: 'password123' }),
      }),
    )

    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.code).toBe(2004)
  })

  it('returns 422 when body is invalid', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alice@test.com', password: 'password123' }),
      }),
    )

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe(1001)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    mockWhere.mockReset()
  })

  it('returns 200 with token on success', async () => {
    mockWhere.mockResolvedValue([mockUser])

    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alice@test.com', password: 'password123' }),
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.code).toBe(0)
    expect(body.data.token).toBe('mock-token')
  })

  it('returns 400 when credentials are wrong', async () => {
    mockWhere.mockResolvedValue([mockUser])

    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alice@test.com', password: 'wrongpassword' }),
      }),
    )

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe(2003)
  })

  it('returns 422 when body is invalid', async () => {
    const res = await app.handle(
      new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: '123' }),
      }),
    )

    expect(res.status).toBe(422)
    const body = await res.json()
    expect(body.code).toBe(1001)
  })
})
