import { loginSchema, registerSchema } from '../validators/user.validator.js';
import { validate } from '../validators/validate.js';

export class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  register = async (req, res) => {
    const data = validate(registerSchema, req.body);
    res.status(201).json(await this.userService.register(data));
  };

  login = async (req, res) => {
    const data = validate(loginSchema, req.body);
    res.json(await this.userService.login(data));
  };

  me = (req, res) => {
    res.json(this.userService.getById(req.userId));
  };
}
