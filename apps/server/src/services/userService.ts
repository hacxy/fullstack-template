import { db } from '../db/index.js'
import { users } from '../db/schema.js'

export class UserService {
  static findAll() {
    return db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    }).from(users)
  }
}
