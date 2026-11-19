import type { CookieOptions, Request, Response } from 'express';
import { API_PREFIX } from '../config.js';
import type { AuthSession } from '../dtos/user.dto.js';
import type { AuthService } from '../services/auth.service.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';
import { validate } from '../validators/validate.js';

export const REFRESH_COOKIE = 'refresh_token';

export class AuthController {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly authService: AuthService,
    cookieSecure: boolean,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'strict',
      secure: cookieSecure,
      path: `${API_PREFIX}/auth`,
    };
  }

  register = async (req: Request, res: Response) => {
    const input = validate(registerSchema, req.body);
    this.sendSession(res.status(201), await this.authService.register(input));
  };

  login = async (req: Request, res: Response) => {
    const input = validate(loginSchema, req.body);
    this.sendSession(res, await this.authService.login(input));
  };

  refresh = async (req: Request, res: Response) => {
    try {
      this.sendSession(res, await this.authService.refresh(req.cookies[REFRESH_COOKIE]));
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
      throw error;
    }
  };

  logout = async (req: Request, res: Response) => {
    await this.authService.logout(req.cookies[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions);
    res.status(204).end();
  };

  private sendSession(res: Response, { refreshToken, ...body }: AuthSession) {
    res.cookie(REFRESH_COOKIE, refreshToken.token, {
      ...this.cookieOptions,
      expires: refreshToken.expiresAt,
    });
    res.json(body);
  }
}
