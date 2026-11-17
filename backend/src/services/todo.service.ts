import { toTodoResponse, type TodoResponse } from '../dtos/todo.dto.js';
import { HttpError } from '../errors.js';
import type { CategoryRepository } from '../repositories/category.repository.js';
import type { TodoData, TodoRepository, TodoWithCategory } from '../repositories/todo.repository.js';
import type { CreateTodoInput, TodoFilters, UpdateTodoInput } from '../validators/todo.validator.js';

export class TodoService {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async list(userId: number, filters: TodoFilters): Promise<TodoResponse[]> {
    const todos = await this.todoRepository.findAllByUser(userId, filters);
    return todos.map(toTodoResponse);
  }

  async getById(userId: number, id: number | null): Promise<TodoResponse> {
    return toTodoResponse(await this.findOrFail(userId, id));
  }

  async create(userId: number, input: CreateTodoInput): Promise<TodoResponse> {
    await this.assertCategoryExists(userId, input.categoryId);
    const todo = await this.todoRepository.create({ userId, ...this.toData(input) });
    return toTodoResponse(todo);
  }

  async update(userId: number, id: number | null, input: UpdateTodoInput): Promise<TodoResponse> {
    const todo = await this.findOrFail(userId, id);
    await this.assertCategoryExists(userId, input.categoryId);

    const updated = await this.todoRepository.update(todo.id, {
      ...this.toData(input),
      completed: input.completed,
    });
    return toTodoResponse(updated);
  }

  async remove(userId: number, id: number | null): Promise<void> {
    const todo = await this.findOrFail(userId, id);
    await this.todoRepository.delete(todo.id);
  }

  private toData({ title, description, dueDate, categoryId }: CreateTodoInput): TodoData {
    return {
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      categoryId: categoryId ?? null,
    };
  }

  private async findOrFail(userId: number, id: number | null): Promise<TodoWithCategory> {
    const todo = id ? await this.todoRepository.findByIdAndUser(id, userId) : null;
    if (!todo) throw new HttpError(404, 'Tarefa não encontrada');
    return todo;
  }

  private async assertCategoryExists(userId: number, categoryId?: number | null): Promise<void> {
    if (categoryId == null) return;
    if (!(await this.categoryRepository.findByIdAndUser(categoryId, userId))) {
      throw new HttpError(400, 'Dados inválidos', { categoryId: 'Categoria não encontrada' });
    }
  }
}
