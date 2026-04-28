import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockFrom = mock()

mock.module('../../src/db', () => ({
  db: {
    select: () => ({ from: mockFrom }),
  },
}))

const { UserService } = await import('../../src/services/userService.js')

const mockUsers = [
  { id: 1, name: 'Alice', email: 'alice@test.com', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Bob', email: 'bob@test.com', createdAt: new Date('2024-01-02') },
]

describe('UserService', () => {
  beforeEach(() => {
    mockFrom.mockReset()
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
})
