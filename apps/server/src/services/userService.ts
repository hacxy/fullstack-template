import { db } from '../db'

export class UserService {
  static findAll() {
    return db.user.findMany()
  }

  static create(data: { name: string }) {
    return db.user.create({ data })
  }
}
