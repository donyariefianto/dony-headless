import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import jwt from 'jsonwebtoken'
import env from '#start/env'
const jwtSecret = env.get('JWT_SECRET')

export default class AuthenticationMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Middleware logic goes here (before the next call)
     */
    let bearerToken = ctx.request.headers()['authorization']
    if (!bearerToken) {
      return ctx.response.unauthorized({
        status: false,
        message: 'Token not found',
      })
    }
    const tokenParts = bearerToken.split(' ')
    if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer') {
      return ctx.response.unauthorized({
        status: false,
        message: 'Format token invalid',
      })
    }
    const token = tokenParts[1]
    try {
      const decoded = jwt.verify(token, jwtSecret)
      ctx.request.user = decoded
      return next()
    } catch (error) {
      return ctx.response.unauthorized({
        status: false,
        message: 'Token invalid',
      })
    }
  }
}
