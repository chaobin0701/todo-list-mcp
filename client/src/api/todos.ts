import { http } from './http'

export type Todo = {
  id: string
  userId: string
  title: string
  description: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

type TodoStatus = 'all' | 'active' | 'completed'

type CreateTodoInput = {
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

type UpdateTodoInput = {
  title?: string
  description?: string | null
  completed?: boolean
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string | null
}

export function fetchTodos(status: TodoStatus = 'all', keyword?: string) {
  return http.get<Todo[]>('/todos', {
    params: {
      status,
      ...(keyword ? { keyword } : {}),
    },
  })
}

export function createTodo(payload: CreateTodoInput) {
  return http.post<Todo>('/todos', payload)
}

export function updateTodo(id: string, payload: UpdateTodoInput) {
  return http.patch<Todo>(`/todos/${id}`, payload)
}

export function deleteTodo(id: string) {
  return http.delete<{ message: string; todo: Todo }>(`/todos/${id}`)
}
