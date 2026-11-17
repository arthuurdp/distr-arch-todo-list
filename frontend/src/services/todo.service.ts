import { client, unwrap } from '@/api/client'
import type { Page } from '@/types/page'
import type { Todo, TodoFilters, TodoInput, TodoSummary, UpdateTodoInput } from '@/types/todo'

export const todoService = {
  list: (filters: TodoFilters = {}) => client.get<Page<Todo>>('/todos', { params: filters }).then(unwrap),
  summary: () => client.get<TodoSummary>('/todos/summary').then(unwrap),
  create: (input: TodoInput) => client.post<Todo>('/todos', input).then(unwrap),
  update: (id: number, input: UpdateTodoInput) => client.put<Todo>(`/todos/${id}`, input).then(unwrap),
  remove: (id: number) => client.delete<void>(`/todos/${id}`).then(unwrap),
}
