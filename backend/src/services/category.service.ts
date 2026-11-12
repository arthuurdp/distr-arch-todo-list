import { toCategoryResponse, type CategoryResponse } from '../dtos/category.dto.js';
import { toTodoResponse, type TodoResponse } from '../dtos/todo.dto.js';
import { HttpError } from '../errors.js';
import type { CategoryRepository, CategoryWithCount } from '../repositories/category.repository.js';
import type { TodoRepository } from '../repositories/todo.repository.js';
import type { CategoryInput } from '../validators/category.validator.js';

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async list(userId: number): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAllByUser(userId);
    return categories
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }))
      .map(toCategoryResponse);
  }

  async getById(userId: number, id: number | null): Promise<CategoryResponse> {
    return toCategoryResponse(await this.findOrFail(userId, id));
  }

  async listTodos(userId: number, id: number | null): Promise<TodoResponse[]> {
    const category = await this.findOrFail(userId, id);
    const todos = await this.todoRepository.findAllByUser(userId, { categoryId: category.id });
    return todos.map(toTodoResponse);
  }

  async create(userId: number, { name }: CategoryInput): Promise<CategoryResponse> {
    await this.assertNameIsFree(userId, name);
    return toCategoryResponse(await this.categoryRepository.create({ userId, name }));
  }

  async rename(userId: number, id: number | null, { name }: CategoryInput): Promise<CategoryResponse> {
    const category = await this.findOrFail(userId, id);
    await this.assertNameIsFree(userId, name, category.id);
    return toCategoryResponse(await this.categoryRepository.updateName(category.id, name));
  }

  async remove(userId: number, id: number | null): Promise<void> {
    const category = await this.findOrFail(userId, id);
    await this.categoryRepository.delete(category.id);
  }

  private async findOrFail(userId: number, id: number | null): Promise<CategoryWithCount> {
    const category = id ? await this.categoryRepository.findByIdAndUser(id, userId) : null;
    if (!category) throw new HttpError(404, 'Categoria não encontrada');
    return category;
  }

  private async assertNameIsFree(userId: number, name: string, ignoreId?: number): Promise<void> {
    const existing = await this.categoryRepository.findByNameAndUser(name, userId);
    if (existing && existing.id !== ignoreId) {
      throw new HttpError(409, 'Já existe uma categoria com esse nome');
    }
  }
}
