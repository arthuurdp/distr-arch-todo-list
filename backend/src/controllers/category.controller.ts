import type { Request, Response } from 'express';
import type { CategoryService } from '../services/category.service.js';
import { categorySchema } from '../validators/category.validator.js';
import { parseId, validate } from '../validators/validate.js';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  list = async (req: Request, res: Response) => {
    res.json(await this.categoryService.list(req.userId));
  };

  create = async (req: Request, res: Response) => {
    const input = validate(categorySchema, req.body);
    res.status(201).json(await this.categoryService.create(req.userId, input));
  };

  getById = async (req: Request, res: Response) => {
    res.json(await this.categoryService.getById(req.userId, parseId(req.params.id)));
  };

  listTodos = async (req: Request, res: Response) => {
    res.json(await this.categoryService.listTodos(req.userId, parseId(req.params.id)));
  };

  update = async (req: Request, res: Response) => {
    const input = validate(categorySchema, req.body);
    res.json(await this.categoryService.rename(req.userId, parseId(req.params.id), input));
  };

  remove = async (req: Request, res: Response) => {
    await this.categoryService.remove(req.userId, parseId(req.params.id));
    res.status(204).end();
  };
}
