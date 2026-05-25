import type { NextFunction, Request, Response } from 'express'

import { authService } from '../services/auth.service.js'
import { verifyAuthToken } from '../utils/jwt.js'

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string
        email: string
      }
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      message: '未登录或缺少授权信息',
    })
  }

  const token = authorization.replace('Bearer ', '').trim()

  try {
    const payload = verifyAuthToken(token)
    const user = await authService.getCurrentUser(payload.userId)

    req.authUser = {
      id: user.id,
      email: user.email,
    }

    next()
  } catch {
    return res.status(401).json({
      message: '登录已失效或 Token 无效',
    })
  }
}
