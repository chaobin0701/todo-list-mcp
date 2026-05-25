import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { authService } from '../services/auth.service.js'

const authRouter = Router()

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
  name: z.string().trim().min(1).max(50).optional(),
})

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

authRouter.post('/register', async (req, res) => {
  try {
    const input = registerSchema.parse(req.body)
    const result = await authService.register({
      email: input.email,
      password: input.password,
      ...(input.name !== undefined ? { name: input.name } : {}),
    })

    res.status(201).json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        message: '该邮箱已被注册',
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '请求参数不合法',
        issues: error.flatten(),
      })
    }

    throw error
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const input = loginSchema.parse(req.body)
    const result = await authService.login({
      email: input.email,
      password: input.password,
    })

    res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        message: '邮箱或密码错误',
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '请求参数不合法',
        issues: error.flatten(),
      })
    }

    throw error
  }
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await authService.getCurrentUser(req.authUser!.id)
  res.json(user)
})

export { authRouter }
