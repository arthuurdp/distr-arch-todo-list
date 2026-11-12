import { HttpError } from '../errors.js';

export class CategoryService {
  constructor(categoryRepository, todoRepository) {
    this.categoryRepository = categoryRepository;
    this.todoRepository = todoRepository;
  }

  list(userId) {
    return this.categoryRepository.findAllByUser(userId);
  }

  getById(userId, id) {
    const category = id && this.categoryRepository.findByIdAndUser(id, userId);
    if (!category) throw new HttpError(404, 'Categoria não encontrada');
    return category;
  }

  listTodos(userId, id) {
    const category = this.getById(userId, id);
    return this.todoRepository.findAllByUser(userId, { categoryId: category.id });
  }

  create(userId, { name }) {
    this.assertNameIsFree(userId, name);
    return this.categoryRepository.create({ userId, name });
  }

  rename(userId, id, { name }) {
    const category = this.getById(userId, id);
    this.assertNameIsFree(userId, name, category.id);

    this.categoryRepository.updateName(category.id, name);
    return this.categoryRepository.findByIdAndUser(category.id, userId);
  }

  remove(userId, id) {
    const category = this.getById(userId, id);
    this.categoryRepository.delete(category.id);
  }

  assertNameIsFree(userId, name, ignoreId) {
    const existing = this.categoryRepository.findByNameAndUser(name, userId);
    if (existing && existing.id !== ignoreId) {
      throw new HttpError(409, 'Já existe uma categoria com esse nome');
    }
  }
}
