import { BusinessError } from 'elysia-response'

export const errors = {
  TOKEN_MISSING: new BusinessError(2001, '缺少 Authorization Token', 401),
  TOKEN_INVALID: new BusinessError(2002, 'Token 无效或已过期', 401),
  AUTH_UNAUTHORIZED: new BusinessError(2003, '邮箱或密码错误', 400),
  AUTH_CONFLICT: new BusinessError(2004, '邮箱已被注册', 409),
}
