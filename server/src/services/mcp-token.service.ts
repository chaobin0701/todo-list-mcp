import type { Request } from 'express'

import { prisma } from '../prisma.js'
import { createTokenPrefix, sha256 } from '../utils/crypto.js'

const defaultScopes = ['todos:read', 'todos:write'] as const

type CreateMcpTokenInput = {
  userId: string
  name: string
}

function serializeScopes(scopes: readonly string[]) {
  return JSON.stringify(scopes)
}

function parseScopes(scopes: string) {
  return JSON.parse(scopes) as string[]
}

function sanitizeTokenRecord(token: {
  id: string
  name: string
  scopes: string
  createdAt: Date
  lastUsedAt: Date | null
}) {
  return {
    id: token.id,
    name: token.name,
    scopes: parseScopes(token.scopes),
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt,
  }
}

export async function authenticateMcpToken(rawToken: string) {
  const tokenHash = sha256(rawToken)

  const tokenRecord = await prisma.mcpToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
    },
  })

  if (!tokenRecord) {
    throw new Error('INVALID_MCP_TOKEN')
  }

  await prisma.mcpToken.update({
    where: { id: tokenRecord.id },
    data: {
      lastUsedAt: new Date(),
    },
  })

  return {
    id: tokenRecord.id,
    userId: tokenRecord.userId,
    scopes: parseScopes(tokenRecord.scopes),
  }
}

export async function authenticateMcpRequest(req: Request) {
  const authorization = req.headers.authorization

  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED')
  }

  const rawToken = authorization.replace('Bearer ', '').trim()

  if (!rawToken) {
    throw new Error('UNAUTHORIZED')
  }

  return authenticateMcpToken(rawToken)
}

export const mcpTokenService = {
  async listTokens(userId: string) {
    const records = await prisma.mcpToken.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return records.map(sanitizeTokenRecord)
  },

  async createToken(input: CreateMcpTokenInput) {
    const rawToken = createTokenPrefix('todo_mcp_')
    const tokenHash = sha256(rawToken)

    const record = await prisma.mcpToken.create({
      data: {
        userId: input.userId,
        name: input.name.trim(),
        tokenHash,
        scopes: serializeScopes(defaultScopes),
      },
    })

    return {
      token: rawToken,
      record: sanitizeTokenRecord(record),
    }
  },

  async revokeToken(userId: string, id: string) {
    const token = await prisma.mcpToken.findFirst({
      where: {
        id,
        userId,
        revokedAt: null,
      },
    })

    if (!token) {
      throw new Error('MCP_TOKEN_NOT_FOUND')
    }

    await prisma.mcpToken.update({
      where: { id: token.id },
      data: {
        revokedAt: new Date(),
      },
    })
  },
}
