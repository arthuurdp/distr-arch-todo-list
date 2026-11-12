import type { PrismaClient } from '../database.js';
import type { Prisma } from '../generated/prisma/client.js';

const withCategory = { category: true } satisfies Prisma.TodoInclude;

export type TodoWithCategory = Prisma.TodoGetPayload<{ include: typeof withCategory }>;

export type TodoData = {
  title: string;
  description: string | null;
  dueDate: Date | null;
  categoryId: number | null;
};

export class TodoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAllByUser(
    userId: number,
    filters: { completed?: boolean; categoryId?: number } = {},
  ): Promise<TodoWithCategory[]> {
    const where: Prisma.TodoWhereInput = { userId };
    if (filters.completed !== undefined) where.completed = filters.completed;
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;

    return this.prisma.todo.findMany({
      where,
      include: withCategory,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  findByIdAndUser(id: number, userId: number): Promise<TodoWithCategory | null> {
    return this.prisma.todo.findFirst({ where: { id, userId }, include: withCategory });
  }

  create(data: TodoData & { userId: number }): Promise<TodoWithCategory> {
    return this.prisma.todo.create({ data, include: withCategory });
  }

  update(id: number, data: TodoData & { completed: boolean }): Promise<TodoWithCategory> {
    return this.prisma.todo.update({ where: { id }, data, include: withCategory });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.todo.delete({ where: { id } });
  }
}
