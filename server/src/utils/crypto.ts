import { createHash, randomBytes } from 'node:crypto'

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

export function createTokenPrefix(prefix: string, bytes = 32) {
  return `${prefix}${randomBytes(bytes).toString('hex')}`
}
