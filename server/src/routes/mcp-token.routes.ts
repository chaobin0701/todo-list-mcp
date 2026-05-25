import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { mcpTokenService } from '../services/mcp-token.service.js'

const mcpTokenRouter = Router()

const createTokenSchema = z.object({
  name: z.string().trim().min(1).max(50),
})

const tokenParamsSchema = z.object({
  id: z.string().min(1),
})

mcpTokenRouter.use(requireAuth)

mcpTokenRouter.get('/', async (req, res) => {
  const tokens = await mcpTokenService.listTokens(req.authUser!.id)
  res.json(tokens)
})

mcpTokenRouter.post('/', async (req, res) => {
  try {
    const input = createTokenSchema.parse(req.body)
    const result = await mcpTokenService.createToken({
      userId: req.authUser!.id,
      name: input.name,
    })

    res.status(201).json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '请求参数不合法',
        issues: error.flatten(),
      })
    }

    throw error
  }
})

mcpTokenRouter.delete('/:id', async (req, res) => {
  try {
    const params = tokenParamsSchema.parse(req.params)
    await mcpTokenService.revokeToken(req.authUser!.id, params.id)

    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'MCP_TOKEN_NOT_FOUND') {
      return res.status(404).json({
        message: 'MCP Token 不存在',
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Token ID 不合法',
        issues: error.flatten(),
      })
    }

    throw error
  }
})

export { mcpTokenRouter }
