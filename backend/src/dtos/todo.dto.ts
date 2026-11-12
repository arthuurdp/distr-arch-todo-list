import type { TodoWithCategory } from '../repositories/todo.repository.js';

export type TodoResponse = {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  categoryId: number | null;
  category: { id: number; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toTodoResponse(todo: TodoWithCategory): TodoResponse {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    dueDate: todo.dueDate ? todo.dueDate.toISOString().slice(0, 10) : null,
    categoryId: todo.categoryId,
    category: todo.category ? { id: todo.category.id, name: todo.category.name } : null,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}
