import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockFrom = mock()
const mockReturning = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: mockFrom }),
    insert: () => ({ values: () => ({ returning: mockReturning }) }),
  },
}))

const { userController } = await import('../../src/controllers/userController')

const mockUsers = [
  { id: 1, name: 'Alice', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Bob', createdAt: new Date('2024-01-02') },
]

describe('GET /api/users', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockReturning.mockReset()
  })

  it('returns 200 with user list', async () => {
    mockFrom.mockResolvedValue(mockUsers)

    const res = await userController.handle(
      new Request('http://localhost/api/users'),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    expect(body[0].name).toBe('Alice')
  })

  it('returns 200 with empty array when no users', async () => {
    mockFrom.mockResolvedValue([])

    const res = await userController.handle(
      new Request('http://localhost/api/users'),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })
})

describe('POST /api/users', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockReturning.mockReset()
  })

  it('creates a user and returns 200', async () => {
    const created = { id: 3, name: 'Charlie', createdAt: new Date() }
    mockReturning.mockResolvedValue([created])

    const res = await userController.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Charlie' }),
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('Charlie')
    expect(body.id).toBe(3)
  })

  it('returns 422 when body is missing name', async () => {
    const res = await userController.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    )

    expect(res.status).toBe(422)
  })

  it('returns 422 when name is empty string', async () => {
    const res = await userController.handle(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      }),
    )

    expect(res.status).toBe(422)
  })
})
