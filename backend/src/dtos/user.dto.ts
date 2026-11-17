import type { User } from '../generated/prisma/client.js';
import type { IssuedRefreshToken } from '../services/token.service.js';

export type UserResponse = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
};

export type AuthResponse = {
  token: string;
  user: UserResponse;
};

export type AuthSession = AuthResponse & {
  refreshToken: IssuedRefreshToken;
};

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
