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

export type TodoListFilters = {
  completed?: boolean;
  categoryId?: number | null;
  dueBefore?: Date;
};

const byUrgency = [
  { completed: 'asc' },
  { dueDate: { sort: 'asc', nulls: 'last' } },
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.TodoOrderByWithRelationInput[];

export class TodoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAllByUser(userId: number, filters: TodoListFilters = {}): Promise<TodoWithCategory[]> {
    return this.prisma.todo.findMany({
      where: this.whereFor(userId, filters),
      include: withCategory,
      orderBy: byUrgency,
    });
  }

  async findPageByUser(
    userId: number,
    filters: TodoListFilters,
    { skip, take }: { skip: number; take: number },
  ): Promise<{ items: TodoWithCategory[]; total: number }> {
    const where = this.whereFor(userId, filters);
    const [items, total] = await Promise.all([
      this.prisma.todo.findMany({ where, include: withCategory, orderBy: byUrgency, skip, take }),
      this.prisma.todo.count({ where }),
    ]);
    return { items, total };
  }

  async countByUser(userId: number): Promise<{ total: number; completed: number }> {
    const [total, completed] = await Promise.all([
      this.prisma.todo.count({ where: { userId } }),
      this.prisma.todo.count({ where: { userId, completed: true } }),
    ]);
    return { total, completed };
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

  private whereFor(userId: number, filters: TodoListFilters): Prisma.TodoWhereInput {
    const where: Prisma.TodoWhereInput = { userId };
    if (filters.completed !== undefined) where.completed = filters.completed;
    if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
    if (filters.dueBefore !== undefined) where.dueDate = { lt: filters.dueBefore };
    return where;
  }
}
