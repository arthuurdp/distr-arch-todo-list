import type { PrismaClient } from '../database.js';
import type { Prisma } from '../generated/prisma/client.js';

const withTodoCount = {
  _count: { select: { todos: true } },
} satisfies Prisma.CategoryInclude;

export type CategoryWithCount = Prisma.CategoryGetPayload<{ include: typeof withTodoCount }>;

export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAllByUser(userId: number): Promise<CategoryWithCount[]> {
    return this.prisma.category.findMany({ where: { userId }, include: withTodoCount });
  }

  findByIdAndUser(id: number, userId: number): Promise<CategoryWithCount | null> {
    return this.prisma.category.findFirst({ where: { id, userId }, include: withTodoCount });
  }

  findByNameAndUser(name: string, userId: number): Promise<CategoryWithCount | null> {
    return this.prisma.category.findFirst({
      where: { userId, name: { equals: name, mode: 'insensitive' } },
      include: withTodoCount,
    });
  }

  create(data: { userId: number; name: string }): Promise<CategoryWithCount> {
    return this.prisma.category.create({ data, include: withTodoCount });
  }

  updateName(id: number, name: string): Promise<CategoryWithCount> {
    return this.prisma.category.update({ where: { id }, data: { name }, include: withTodoCount });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
