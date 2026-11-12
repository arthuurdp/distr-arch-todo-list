import { categorySchema } from '../validators/category.validator.js';
import { parseId, validate } from '../validators/validate.js';

export class CategoryController {
  constructor(categoryService) {
    this.categoryService = categoryService;
  }

  list = (req, res) => {
    res.json(this.categoryService.list(req.userId));
  };

  create = (req, res) => {
    const data = validate(categorySchema, req.body);
    res.status(201).json(this.categoryService.create(req.userId, data));
  };

  getById = (req, res) => {
    res.json(this.categoryService.getById(req.userId, parseId(req.params.id)));
  };

  listTodos = (req, res) => {
    res.json(this.categoryService.listTodos(req.userId, parseId(req.params.id)));
  };

  update = (req, res) => {
    const data = validate(categorySchema, req.body);
    res.json(this.categoryService.rename(req.userId, parseId(req.params.id), data));
  };

  remove = (req, res) => {
    this.categoryService.remove(req.userId, parseId(req.params.id));
    res.status(204).end();
  };
}
