import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'

import { env } from '../config.js'

type JwtPayload = {
  userId: string
  email: string
}

export function signAuthToken(payload: JwtPayload) {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
  }

  return jwt.sign(payload, env.JWT_SECRET as Secret, options)
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}
