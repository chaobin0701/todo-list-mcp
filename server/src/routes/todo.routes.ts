import { Router } from 'express'
import { z } from 'zod'

import { requireAuth } from '../middleware/auth.js'
import { todoService } from '../services/todo.service.js'

const todoRouter = Router()

const prioritySchema = z.enum(['low', 'medium', 'high'])

const listTodosQuerySchema = z.object({
  status: z.enum(['all', 'active', 'completed']).optional(),
  keyword: z.string().trim().min(1).optional(),
})

const createTodoSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  priority: prioritySchema.optional(),
  dueDate: z.iso.datetime().optional(),
})

const updateTodoParamsSchema = z.object({
  id: z.string().min(1),
})

const updateTodoSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    completed: z.boolean().optional(),
    priority: prioritySchema.optional(),
    dueDate: z.union([z.iso.datetime(), z.null()]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: '至少需要提供一个更新字段',
  })

todoRouter.use(requireAuth)

todoRouter.get('/', async (req, res) => {
  try {
    const query = listTodosQuerySchema.parse(req.query)
    const todos = await todoService.listTodos({
      userId: req.authUser!.id,
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.keyword !== undefined ? { keyword: query.keyword } : {}),
    })

    res.json(todos)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: '查询参数不合法',
        issues: error.flatten(),
      })
    }

    throw error
  }
})

todoRouter.post('/', async (req, res) => {
  try {
    const input = createTodoSchema.parse(req.body)
    const todo = await todoService.createTodo({
      userId: req.authUser!.id,
      title: input.title,
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    })

    res.status(201).json(todo)
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

todoRouter.patch('/:id', async (req, res) => {
  try {
    const params = updateTodoParamsSchema.parse(req.params)
    const input = updateTodoSchema.parse(req.body)
    const todo = await todoService.updateTodo({
      userId: req.authUser!.id,
      id: params.id,
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.completed !== undefined ? { completed: input.completed } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    })

    res.json(todo)
  } catch (error) {
    if (error instanceof Error && error.message === 'TODO_NOT_FOUND') {
      return res.status(404).json({
        message: '待办不存在',
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

todoRouter.delete('/:id', async (req, res) => {
  try {
    const params = updateTodoParamsSchema.parse(req.params)
    const todo = await todoService.deleteTodo(req.authUser!.id, params.id)

    res.json({
      message: '待办已删除',
      todo,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'TODO_NOT_FOUND') {
      return res.status(404).json({
        message: '待办不存在',
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

export { todoRouter }
