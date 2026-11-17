import type { Request, Response } from 'express';
import type { TodoService } from '../services/todo.service.js';
import { createTodoSchema, todoFiltersSchema, updateTodoSchema } from '../validators/todo.validator.js';
import { parseId, validate } from '../validators/validate.js';

export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  list = async (req: Request, res: Response) => {
    const filters = validate(todoFiltersSchema, req.query);
    res.json(await this.todoService.list(req.userId, filters));
  };

  create = async (req: Request, res: Response) => {
    const input = validate(createTodoSchema, req.body);
    res.status(201).json(await this.todoService.create(req.userId, input));
  };

  getById = async (req: Request, res: Response) => {
    res.json(await this.todoService.getById(req.userId, parseId(req.params.id)));
  };

  update = async (req: Request, res: Response) => {
    const input = validate(updateTodoSchema, req.body);
    res.json(await this.todoService.update(req.userId, parseId(req.params.id), input));
  };

  remove = async (req: Request, res: Response) => {
    await this.todoService.remove(req.userId, parseId(req.params.id));
    res.status(204).end();
  };
}
