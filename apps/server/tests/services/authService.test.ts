import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockWhere = mock()
const mockReturning = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: mockWhere }) }),
    insert: () => ({ values: () => ({ returning: mockReturning }) }),
  },
}))

const { AuthService } = await import('../../src/services/authService.js')
const { errors } = await import('../../src/errors.js')

const PASSWORD = 'password123'
const PASSWORD_HASH = await Bun.password.hash(PASSWORD)

const mockUser = {
  id: 1,
  name: 'Alice',
  email: 'alice@test.com',
  passwordHash: PASSWORD_HASH,
  createdAt: new Date(),
}

describe('AuthService', () => {
  beforeEach(() => {
    mockWhere.mockReset()
    mockReturning.mockReset()
  })

  describe('register', () => {
    it('creates and returns a new user', async () => {
      mockWhere.mockResolvedValue([])
      mockReturning.mockResolvedValue([mockUser])

      const result = await AuthService.register({ name: 'Alice', email: 'alice@test.com', password: PASSWORD })

      expect(result).toEqual(mockUser)
    })

    it('throws AUTH_CONFLICT when email already exists', async () => {
      mockWhere.mockResolvedValue([mockUser])

      await expect(
        AuthService.register({ name: 'Alice', email: 'alice@test.com', password: PASSWORD }),
      ).rejects.toBe(errors.AUTH_CONFLICT)
    })
  })

  describe('login', () => {
    it('returns user when credentials are correct', async () => {
      mockWhere.mockResolvedValue([mockUser])

      const result = await AuthService.login({ email: 'alice@test.com', password: PASSWORD })

      expect(result).toEqual(mockUser)
    })

    it('throws AUTH_UNAUTHORIZED when user not found', async () => {
      mockWhere.mockResolvedValue([])

      await expect(
        AuthService.login({ email: 'unknown@test.com', password: PASSWORD }),
      ).rejects.toBe(errors.AUTH_UNAUTHORIZED)
    })

    it('throws AUTH_UNAUTHORIZED when password is wrong', async () => {
      mockWhere.mockResolvedValue([mockUser])

      await expect(
        AuthService.login({ email: 'alice@test.com', password: 'wrongpassword' }),
      ).rejects.toBe(errors.AUTH_UNAUTHORIZED)
    })
  })
})
