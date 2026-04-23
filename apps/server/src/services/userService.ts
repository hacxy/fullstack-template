import { db } from '../db/index.js'
import { users } from '../db/schema.js'

export class UserService {
  static findAll() {
    return db.select().from(users)
  }

  static async create(data: { name: string }) {
    const rows = await db.insert(users).values(data).returning()
    return rows[0]
  }
}
