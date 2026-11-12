import bcrypt from 'bcryptjs';
import { toUserResponse, type AuthSession, type UserResponse } from '../dtos/user.dto.js';
import { HttpError } from '../errors.js';
import type { User } from '../generated/prisma/client.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { LoginInput, RegisterInput } from '../validators/user.validator.js';
import type { IssuedRefreshToken, TokenService } from './token.service.js';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async register({ name, email, password }: RegisterInput): Promise<AuthSession> {
    if (await this.userRepository.findByEmail(email)) {
      throw new HttpError(409, 'Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({ name, email, passwordHash });

    return this.startSession(user);
  }

  async login({ email, password }: LoginInput): Promise<AuthSession> {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Email ou senha incorretos');
    }

    return this.startSession(user);
  }

  async refresh(refreshToken: string | undefined): Promise<AuthSession> {
    const rotated = await this.tokenService.rotateRefreshToken(refreshToken);

    const user = await this.userRepository.findById(rotated.userId);
    if (!user) throw new HttpError(401, 'Sessão expirada. Entre novamente.');

    return this.toSession(user, rotated.refreshToken);
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    await this.tokenService.revokeRefreshToken(refreshToken);
  }

  async getById(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new HttpError(404, 'Usuário não encontrado');
    return toUserResponse(user);
  }

  private async startSession(user: User): Promise<AuthSession> {
    return this.toSession(user, await this.tokenService.issueRefreshToken(user.id));
  }

  private toSession(user: User, refreshToken: IssuedRefreshToken): AuthSession {
    return {
      token: this.tokenService.signAccessToken(user.id),
      user: toUserResponse(user),
      refreshToken,
    };
  }
}
