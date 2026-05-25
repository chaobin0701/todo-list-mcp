import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'

const apiBaseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000'
const mcpBaseUrl = process.env.MCP_BASE_URL ?? 'http://localhost:3000/mcp'
const defaultPassword = process.env.SMOKE_TEST_PASSWORD ?? 'secret123'

type JsonResponse<T> = {
  status: number
  body: T
}

type AuthResponse = {
  token: string
  user: {
    id: string
    email: string
  }
}

type McpTokenCreateResponse = {
  token: string
  record: {
    id: string
  }
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<JsonResponse<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const text = await response.text()
  const body = text ? (JSON.parse(text) as T) : (null as T)

  return {
    status: response.status,
    body,
  }
}

function extractToolJson(result: unknown) {
  const callResult = result as {
    content?: Array<{
      type: string
      text?: string
    }>
  }
  const firstContent = callResult.content?.[0]

  if (!firstContent || firstContent.type !== 'text' || typeof firstContent.text !== 'string') {
    throw new Error('Expected first MCP tool content item to be text')
  }

  return JSON.parse(firstContent.text)
}

async function main() {
  const email = `smoke_${Date.now()}@example.com`

  const register = await jsonRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: defaultPassword,
      name: 'Smoke Test User',
    }),
  })

  if (register.status !== 201) {
    throw new Error(`Failed to register smoke test user: ${JSON.stringify(register.body)}`)
  }

  const webToken = register.body.token

  const createMcpToken = await jsonRequest<McpTokenCreateResponse>('/api/mcp-tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${webToken}`,
    },
    body: JSON.stringify({
      name: 'Smoke Test Token',
    }),
  })

  if (createMcpToken.status !== 201) {
    throw new Error(`Failed to create MCP token: ${JSON.stringify(createMcpToken.body)}`)
  }

  const mcpToken = createMcpToken.body.token
  const transport = new StreamableHTTPClientTransport(new URL(mcpBaseUrl), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${mcpToken}`,
      },
    },
  })

  const client = new Client(
    {
      name: 'todo-mcp-demo-smoke-test',
      version: '1.0.0',
    },
    {
      capabilities: {},
    },
  )

  await client.connect(transport as never)

  try {
    const tools = await client.listTools()
    const createdTodo = extractToolJson(
      await client.callTool({
        name: 'create_todo',
        arguments: {
          title: 'Smoke test task',
          priority: 'high',
        },
      }),
    )
    const createdTodoId = createdTodo.todo.id as string

    const listedTodos = extractToolJson(
      await client.callTool({
        name: 'list_todos',
        arguments: {
          keyword: 'Smoke test task',
        },
      }),
    )

    const updatedTodo = extractToolJson(
      await client.callTool({
        name: 'update_todo',
        arguments: {
          id: createdTodoId,
          title: 'Smoke test task updated',
          priority: 'low',
        },
      }),
    )

    const completedTodo = extractToolJson(
      await client.callTool({
        name: 'complete_todo',
        arguments: {
          id: createdTodoId,
        },
      }),
    )

    const deletedTodo = extractToolJson(
      await client.callTool({
        name: 'delete_todo',
        arguments: {
          id: createdTodoId,
          confirm: true,
        },
      }),
    )

    console.log(
      JSON.stringify(
        {
          apiBaseUrl,
          mcpBaseUrl,
          registeredUser: register.body.user,
          mcpTokenPrefix: mcpToken.slice(0, 9),
          toolNames: tools.tools.map((tool) => tool.name),
          createdTodo,
          listedTodos,
          updatedTodo,
          completedTodo,
          deletedTodo,
        },
        null,
        2,
      ),
    )
  } finally {
    await client.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
