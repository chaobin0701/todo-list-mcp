import * as z from 'zod/v4'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { authenticateMcpRequest } from './services/mcp-token.service.js'
import { todoService } from './services/todo.service.js'

type McpUserContext = {
  userId: string
  scopes: string[]
}

function assertScope(scopes: string[], requiredScope: 'todos:read' | 'todos:write') {
  if (!scopes.includes(requiredScope)) {
    throw new Error('FORBIDDEN')
  }
}

function formatToolResult(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  }
}

function createTodoMcpServer(currentUser: McpUserContext) {
  const server = new McpServer({
    name: 'todo-mcp-demo',
    version: '1.0.0',
  })

  server.registerTool(
    'list_todos',
    {
      title: '查看待办',
      description: '获取当前已授权用户的待办列表。',
      inputSchema: {
        status: z.enum(['all', 'active', 'completed']).optional(),
        keyword: z.string().trim().min(1).optional(),
      },
      annotations: {
        readOnlyHint: true,
      },
    },
    async ({ status, keyword }) => {
      assertScope(currentUser.scopes, 'todos:read')

      const todos = await todoService.listTodos({
        userId: currentUser.userId,
        ...(status !== undefined ? { status } : {}),
        ...(keyword !== undefined ? { keyword } : {}),
      })

      return formatToolResult({
        total: todos.length,
        todos,
      })
    },
  )

  server.registerTool(
    'create_todo',
    {
      title: '新建待办',
      description: '为当前已授权用户创建一条新的待办。',
      inputSchema: {
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(2000).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        dueDate: z.iso.datetime().optional(),
      },
    },
    async ({ title, description, priority, dueDate }) => {
      assertScope(currentUser.scopes, 'todos:write')

      const todo = await todoService.createTodo({
        userId: currentUser.userId,
        title,
        ...(description !== undefined ? { description } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      })

      return formatToolResult({
        message: '待办创建成功',
        todo,
      })
    },
  )

  server.registerTool(
    'update_todo',
    {
      title: '更新待办',
      description: '更新当前已授权用户的一条待办。',
      inputSchema: {
        id: z.string().min(1),
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(2000).optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
        dueDate: z.union([z.iso.datetime(), z.null()]).optional(),
      },
    },
    async ({ id, title, description, priority, dueDate }) => {
      assertScope(currentUser.scopes, 'todos:write')

      const todo = await todoService.updateTodo({
        userId: currentUser.userId,
        id,
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      })

      return formatToolResult({
        message: '待办更新成功',
        todo,
      })
    },
  )

  server.registerTool(
    'complete_todo',
    {
      title: '完成待办',
      description: '将当前已授权用户的一条待办标记为已完成。',
      inputSchema: {
        id: z.string().min(1),
      },
    },
    async ({ id }) => {
      assertScope(currentUser.scopes, 'todos:write')

      const todo = await todoService.completeTodo(currentUser.userId, id)

      return formatToolResult({
        message: '待办已完成',
        todo,
      })
    },
  )

  server.registerTool(
    'delete_todo',
    {
      title: '删除待办',
      description: '删除当前已授权用户的一条待办。危险操作，仅在用户明确确认后调用。',
      inputSchema: {
        id: z.string().min(1),
        confirm: z.literal(true),
      },
      annotations: {
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      assertScope(currentUser.scopes, 'todos:write')

      const todo = await todoService.deleteTodo(currentUser.userId, id)

      return formatToolResult({
        message: '待办已删除',
        todo,
      })
    },
  )

  return server
}

export async function handleMcpRequest(req: import('express').Request, res: import('express').Response) {
  try {
    const currentUser = await authenticateMcpRequest(req)
    const transport = new StreamableHTTPServerTransport()
    const server = createTodoMcpServer({
      userId: currentUser.userId,
      scopes: currentUser.scopes,
    })

    transport.onerror = (error) => {
      console.error('MCP transport error:', error)
    }

    await server.connect(transport as never)
    await transport.handleRequest(req, res, req.body)
    await server.close()
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      res.status(401).json({
        message: '缺少 MCP 授权信息',
      })
      return
    }

    if (error instanceof Error && error.message === 'INVALID_MCP_TOKEN') {
      res.status(401).json({
        message: 'MCP Token 无效',
      })
      return
    }

    if (error instanceof Error && error.message === 'FORBIDDEN') {
      res.status(403).json({
        message: 'MCP Token 权限不足',
      })
      return
    }

    if (error instanceof Error && error.message === 'TODO_NOT_FOUND') {
      res.status(404).json({
        message: '待办不存在',
      })
      return
    }

    console.error('Error handling MCP request:', error)

    if (!res.headersSent) {
      res.status(500).json({
        message: '服务器内部错误',
      })
    }
  }
}
