import { client, unwrap } from '@/api/client'
import type { Category } from '@/types/category'
import type { Todo } from '@/types/todo'

export const categoryService = {
  list: () => client.get<Category[]>('/categories').then(unwrap),
  create: (name: string) => client.post<Category>('/categories', { name }).then(unwrap),
  update: (id: number, name: string) => client.put<Category>(`/categories/${id}`, { name }).then(unwrap),
  remove: (id: number) => client.delete<void>(`/categories/${id}`).then(unwrap),
  listTodos: (id: number) => client.get<Todo[]>(`/categories/${id}/todos`).then(unwrap),
}
