import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockFrom = mock()
const mockReturning = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: mockFrom }),
    insert: () => ({ values: () => ({ returning: mockReturning }) }),
  },
}))

const { UserService } = await import('../../src/services/userService')

const mockUsers = [
  { id: 1, name: 'Alice', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Bob', createdAt: new Date('2024-01-02') },
]

describe('UserService', () => {
  beforeEach(() => {
    mockFrom.mockReset()
    mockReturning.mockReset()
  })

  describe('findAll', () => {
    it('returns all users from db', async () => {
      mockFrom.mockResolvedValue(mockUsers)

      const result = await UserService.findAll()

      expect(mockFrom).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUsers)
    })

    it('returns empty array when no users exist', async () => {
      mockFrom.mockResolvedValue([])

      const result = await UserService.findAll()

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates a user with given name', async () => {
      const newUser = { id: 3, name: 'Charlie', createdAt: new Date() }
      mockReturning.mockResolvedValue([newUser])

      const result = await UserService.create({ name: 'Charlie' })

      expect(mockReturning).toHaveBeenCalledTimes(1)
      expect(result).toEqual(newUser)
    })
  })
})
