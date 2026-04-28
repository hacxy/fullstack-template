import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import { errors } from '../errors.js'

export class AuthService {
  static async register(data: { name: string, email: string, password: string }) {
    const existing = await db.select().from(users).where(eq(users.email, data.email))
    if (existing.length > 0)
      throw errors.AUTH_CONFLICT

    const passwordHash = await Bun.password.hash(data.password)
    const rows = await db
      .insert(users)
      .values({ name: data.name, email: data.email, passwordHash })
      .returning()
    return rows[0]!
  }

  static async login(data: { email: string, password: string }) {
    const rows = await db.select().from(users).where(eq(users.email, data.email))
    const user = rows[0]
    if (!user)
      throw errors.AUTH_UNAUTHORIZED

    const valid = await Bun.password.verify(data.password, user.passwordHash)
    if (!valid)
      throw errors.AUTH_UNAUTHORIZED

    return user
  }
}
