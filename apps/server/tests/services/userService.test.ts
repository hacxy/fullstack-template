import { beforeEach, describe, expect, it, mock } from 'bun:test'

const mockFindMany = mock()
const mockCreate = mock()

mock.module('../../src/_db', () => ({
  db: {
    user: {
      findMany: mockFindMany,
      create: mockCreate,
    },
  },
}))

const { UserService } = await import('../../src/services/userService')

const mockUsers = [
  { id: 1, name: 'Alice', createdAt: new Date('2024-01-01') },
  { id: 2, name: 'Bob', createdAt: new Date('2024-01-02') },
]

describe('UserService', () => {
  beforeEach(() => {
    mockFindMany.mockReset()
    mockCreate.mockReset()
  })

  describe('findAll', () => {
    it('returns all users from db', async () => {
      mockFindMany.mockResolvedValue(mockUsers)

      const result = await UserService.findAll()

      expect(mockFindMany).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUsers)
    })

    it('returns empty array when no users exist', async () => {
      mockFindMany.mockResolvedValue([])

      const result = await UserService.findAll()

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates a user with given name', async () => {
      const newUser = { id: 3, name: 'Charlie', createdAt: new Date() }
      mockCreate.mockResolvedValue(newUser)

      const result = await UserService.create({ name: 'Charlie' })

      expect(mockCreate).toHaveBeenCalledWith({ data: { name: 'Charlie' } })
      expect(result).toEqual(newUser)
    })
  })
})
