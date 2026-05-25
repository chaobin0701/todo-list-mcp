import { prisma } from '../prisma.js'

type ListTodosInput = {
  userId: string
  status?: 'all' | 'active' | 'completed'
  keyword?: string
}

type CreateTodoInput = {
  userId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

type UpdateTodoInput = {
  userId: string
  id: string
  title?: string
  description?: string | null
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
}

function normalizeDueDate(dueDate?: string | null) {
  if (dueDate === undefined) {
    return undefined
  }

  if (dueDate === null || dueDate === '') {
    return null
  }

  return new Date(dueDate)
}

export const todoService = {
  async listTodos({ userId, status = 'all', keyword }: ListTodosInput) {
    return prisma.todo.findMany({
      where: {
        userId,
        ...(status === 'active' ? { completed: false } : {}),
        ...(status === 'completed' ? { completed: true } : {}),
        ...(keyword
          ? {
              OR: [
                {
                  title: {
                    contains: keyword,
                  },
                },
                {
                  description: {
                    contains: keyword,
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: [
        { completed: 'asc' },
        { createdAt: 'desc' },
      ],
    })
  },

  async createTodo(input: CreateTodoInput) {
    const dueDate = normalizeDueDate(input.dueDate)

    return prisma.todo.create({
      data: {
        userId: input.userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        priority: input.priority ?? 'medium',
        ...(dueDate !== undefined ? { dueDate } : {}),
      },
    })
  },

  async updateTodo(input: UpdateTodoInput) {
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id: input.id,
        userId: input.userId,
      },
    })

    if (!existingTodo) {
      throw new Error('TODO_NOT_FOUND')
    }

    const dueDate = normalizeDueDate(input.dueDate)

    return prisma.todo.update({
      where: { id: existingTodo.id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined
          ? { description: input.description?.trim() || null }
          : {}),
        ...(input.completed !== undefined ? { completed: input.completed } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      },
    })
  },

  async completeTodo(userId: string, id: string) {
    return this.updateTodo({
      userId,
      id,
      completed: true,
    })
  },

  async deleteTodo(userId: string, id: string) {
    const existingTodo = await prisma.todo.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!existingTodo) {
      throw new Error('TODO_NOT_FOUND')
    }

    await prisma.todo.delete({
      where: { id: existingTodo.id },
    })

    return existingTodo
  },
}
