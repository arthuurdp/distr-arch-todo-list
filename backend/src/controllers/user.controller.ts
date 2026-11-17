import type { CookieOptions, Request, Response } from 'express';
import type { AuthSession } from '../dtos/user.dto.js';
import type { UserService } from '../services/user.service.js';
import { loginSchema, registerSchema } from '../validators/user.validator.js';
import { validate } from '../validators/validate.js';

export const REFRESH_COOKIE = 'refresh_token';

export class UserController {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly userService: UserService,
    cookieSecure: boolean,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'strict',
      secure: cookieSecure,
      path: '/api/users',
    };
  }

  register = async (req: Request, res: Response) => {
    const input = validate(registerSchema, req.body);
    this.sendSession(res.status(201), await this.userService.register(input));
  };

  login = async (req: Request, res: Response) => {
    const input = validate(loginSchema, req.body);
    this.sendSession(res, await this.userService.login(input));
  };

  refresh = async (req: Request, res: Response) => {
    try {
      this.sendSession(res, await this.userService.refresh(req.cookies[REFRESH_COOKIE]));
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
      throw error;
    }
  };

  logout = async (req: Request, res: Response) => {
    await this.userService.logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
    res.status(204).end();
  };

  me = async (req: Request, res: Response) => {
    res.json(await this.userService.getById(req.userId));
  };

  private sendSession(res: Response, { refreshToken, ...body }: AuthSession) {
    res.cookie(REFRESH_COOKIE, refreshToken.token, {
      ...this.cookieOptions,
      expires: refreshToken.expiresAt,
    });
    res.json(body);
  }
}
