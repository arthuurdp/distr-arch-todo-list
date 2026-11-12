import type { CategoryWithCount } from '../repositories/category.repository.js';

export type CategoryResponse = {
  id: number;
  name: string;
  todoCount: number;
  createdAt: Date;
};

export function toCategoryResponse(category: CategoryWithCount): CategoryResponse {
  return {
    id: category.id,
    name: category.name,
    todoCount: category._count.todos,
    createdAt: category.createdAt,
  };
}
