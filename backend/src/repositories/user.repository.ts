import type { PrismaClient } from '../database.js';
import type { User } from '../generated/prisma/client.js';

export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
