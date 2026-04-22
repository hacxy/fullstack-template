import { db } from '../db'
import { users } from '../db/schema'

export class UserService {
  static findAll() {
    return db.select().from(users)
  }

  static async create(data: { name: string }) {
    const rows = await db.insert(users).values(data).returning()
    return rows[0]
  }
}
