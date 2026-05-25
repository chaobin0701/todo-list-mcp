import bcrypt from 'bcryptjs'

import { prisma } from '../prisma.js'
import { signAuthToken } from '../utils/jwt.js'

type RegisterInput = {
  email: string
  password: string
  name?: string
}

type LoginInput = {
  email: string
  password: string
}

function sanitizeUser(user: {
  id: string
  email: string
  name: string | null
  createdAt: Date
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export const authService = {
  async register(input: RegisterInput) {
    const email = normalizeEmail(input.email)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }

    const passwordHash = await bcrypt.hash(input.password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name?.trim() || null,
      },
    })

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
    })

    return {
      token,
      user: sanitizeUser(user),
    }
  },

  async login(input: LoginInput) {
    const email = normalizeEmail(input.email)

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash)

    if (!passwordMatches) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const token = signAuthToken({
      userId: user.id,
      email: user.email,
    })

    return {
      token,
      user: sanitizeUser(user),
    }
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new Error('USER_NOT_FOUND')
    }

    return user
  },
}
