import { HttpError } from '../errors.js';

export class TodoService {
  constructor(todoRepository, categoryRepository) {
    this.todoRepository = todoRepository;
    this.categoryRepository = categoryRepository;
  }

  list(userId, filters) {
    return this.todoRepository.findAllByUser(userId, filters);
  }

  getById(userId, id) {
    const todo = id && this.todoRepository.findByIdAndUser(id, userId);
    if (!todo) throw new HttpError(404, 'Tarefa não encontrada');
    return todo;
  }

  create(userId, data) {
    this.assertCategoryExists(userId, data.categoryId);
    return this.todoRepository.create({ userId, ...this.normalize(data) });
  }

  update(userId, id, data) {
    const todo = this.getById(userId, id);
    this.assertCategoryExists(userId, data.categoryId);

    this.todoRepository.update(todo.id, { ...this.normalize(data), completed: data.completed });
    return this.todoRepository.findByIdAndUser(todo.id, userId);
  }

  remove(userId, id) {
    const todo = this.getById(userId, id);
    this.todoRepository.delete(todo.id);
  }

  normalize({ title, description, dueDate, categoryId }) {
    return {
      title,
      description: description || null,
      dueDate: dueDate ?? null,
      categoryId: categoryId ?? null,
    };
  }

  assertCategoryExists(userId, categoryId) {
    if (categoryId != null && !this.categoryRepository.findByIdAndUser(categoryId, userId)) {
      throw new HttpError(400, 'Dados inválidos', { categoryId: 'Categoria não encontrada' });
    }
  }
}
