export type Todo = {
  id: number
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  categoryId: number | null
  category: { id: number; name: string } | null
  createdAt: string
  updatedAt: string
}

export type TodoInput = {
  title: string
  description: string | null
  dueDate: string | null
  categoryId: number | null
}

export type UpdateTodoInput = TodoInput & { completed: boolean }

export type TodoFilters = {
  completed?: boolean
  categoryId?: number | 'none'
}

export type TodoSummary = {
  total: number
  completed: number
}
