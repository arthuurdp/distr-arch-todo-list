import { createTodoSchema, todoFiltersSchema, updateTodoSchema } from '../validators/todo.validator.js';
import { parseId, validate } from '../validators/validate.js';

export class TodoController {
  constructor(todoService) {
    this.todoService = todoService;
  }

  list = (req, res) => {
    const filters = validate(todoFiltersSchema, req.query);
    res.json(this.todoService.list(req.userId, filters));
  };

  create = (req, res) => {
    const data = validate(createTodoSchema, req.body);
    res.status(201).json(this.todoService.create(req.userId, data));
  };

  getById = (req, res) => {
    res.json(this.todoService.getById(req.userId, parseId(req.params.id)));
  };

  update = (req, res) => {
    const data = validate(updateTodoSchema, req.body);
    res.json(this.todoService.update(req.userId, parseId(req.params.id), data));
  };

  remove = (req, res) => {
    this.todoService.remove(req.userId, parseId(req.params.id));
    res.status(204).end();
  };
}
