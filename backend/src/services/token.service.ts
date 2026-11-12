import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { AuthConfig } from '../config.js';
import { HttpError } from '../errors.js';
import type { RefreshTokenRepository } from '../repositories/refresh-token.repository.js';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export type IssuedRefreshToken = {
  token: string;
  expiresAt: Date;
};

export class TokenService {
  private readonly secret: string;
  private readonly accessExpiresIn: SignOptions['expiresIn'];
  private readonly refreshTtlMs: number;

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    { jwtSecret, jwtExpiresIn, refreshTokenDays }: AuthConfig,
  ) {
    this.secret = jwtSecret;
    this.accessExpiresIn = jwtExpiresIn as SignOptions['expiresIn'];
    this.refreshTtlMs = refreshTokenDays * DAY_IN_MS;
  }

  signAccessToken(userId: number): string {
    return jwt.sign({}, this.secret, {
      subject: String(userId),
      expiresIn: this.accessExpiresIn,
    });
  }

  verifyAccessToken(token: string): number | null {
    try {
      const payload = jwt.verify(token, this.secret);
      const userId = Number(typeof payload === 'string' ? NaN : payload.sub);
      return Number.isInteger(userId) ? userId : null;
    } catch {
      return null;
    }
  }

  async issueRefreshToken(userId: number): Promise<IssuedRefreshToken> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.refreshTokenRepository.create({ userId, tokenHash: this.hash(token), expiresAt });
    return { token, expiresAt };
  }

  async rotateRefreshToken(token: string | undefined) {
    const stored = token ? await this.refreshTokenRepository.findByHash(this.hash(token)) : null;
    if (!stored || stored.expiresAt <= new Date()) {
      throw this.sessionExpired();
    }

    const revokedNow = !stored.revokedAt && (await this.refreshTokenRepository.revoke(stored.id));
    if (!revokedNow) {
      await this.refreshTokenRepository.revokeAllByUser(stored.userId);
      throw this.sessionExpired();
    }

    return {
      userId: stored.userId,
      refreshToken: await this.issueRefreshToken(stored.userId),
    };
  }

  async revokeRefreshToken(token: string | undefined): Promise<void> {
    if (!token) return;
    const stored = await this.refreshTokenRepository.findByHash(this.hash(token));
    if (stored) await this.refreshTokenRepository.revoke(stored.id);
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private sessionExpired(): HttpError {
    return new HttpError(401, 'Sessão expirada. Entre novamente.');
  }
}
