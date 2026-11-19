import type { Request, Response } from 'express';
import type { UserService } from '../services/user.service.js';

export class UserController {
  constructor(private readonly userService: UserService) {}

  me = async (req: Request, res: Response) => {
    res.json(await this.userService.getById(req.userId));
  };
}
