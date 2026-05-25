import cors from 'cors'
import express from 'express'

import { env } from './config.js'
import { handleMcpRequest } from './mcp.js'
import { prisma } from './prisma.js'
import { authRouter } from './routes/auth.routes.js'
import { mcpTokenRouter } from './routes/mcp-token.routes.js'
import { todoRouter } from './routes/todo.routes.js'

const app = express()
const allowedOrigins = env.CLIENT_ORIGIN.split(',').map((origin) => origin.trim())

app.use(
  cors({
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Custom-Auth-Headers',
      'mcp-session-id',
      'mcp-protocol-version',
      'last-event-id',
    ],
    exposedHeaders: ['mcp-session-id', 'mcp-protocol-version'],
    origin(origin, callback) {
      if (env.NODE_ENV === 'development') {
        callback(null, true)
        return
      }

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)
app.use(express.json())

app.get('/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`

  res.json({
    status: 'ok',
    service: 'todo-mcp-demo-server',
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    stage: 'phase-2',
    message: 'Auth and todo APIs are ready for local development.',
  })
})

app.use('/api/auth', authRouter)
app.use('/api/todos', todoRouter)
app.use('/api/mcp-tokens', mcpTokenRouter)
app.all('/mcp', handleMcpRequest)

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)

  res.status(500).json({
    message: 'Internal server error',
  })
})

app.listen(env.PORT, () => {
  console.log(`todo-mcp-demo server listening on http://localhost:${env.PORT}`)
})
