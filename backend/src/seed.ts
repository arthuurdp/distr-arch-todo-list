import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { createPrismaClient } from './database.js';

const DEMO_USER = {
  name: 'Usuário Demo',
  email: 'demo@todolist.com',
  password: 'Demo@12345',
};

type SeedTodo = {
  title: string;
  description?: string;
  category?: string;
  dueInDays?: number;
  completed?: boolean;
};

const CATEGORIES = ['Faculdade', 'Trabalho', 'Casa', 'Saúde'];

const TODOS: SeedTodo[] = [
  {
    title: 'Entregar o trabalho de React',
    description: 'Zip com API e front-end no Moodle',
    category: 'Faculdade',
    dueInDays: 5,
  },
  {
    title: 'Ensaiar a apresentação',
    description: 'Mostrar rotas, autenticação, testes e o componente shadcn',
    category: 'Faculdade',
    dueInDays: 4,
  },
  {
    title: 'Estudar para a prova de redes',
    category: 'Faculdade',
    dueInDays: -2,
  },
  {
    title: 'Ler o capítulo 3 de Arquitetura',
    category: 'Faculdade',
    dueInDays: -7,
    completed: true,
  },
  {
    title: 'Revisar o pull request do time',
    category: 'Trabalho',
    dueInDays: 1,
  },
  {
    title: 'Preparar a reunião de planejamento',
    description: 'Levar a lista de pendências da sprint',
    category: 'Trabalho',
    dueInDays: 3,
  },
  {
    title: 'Atualizar a documentação da API',
    category: 'Trabalho',
    completed: true,
  },
  {
    title: 'Pagar a conta de luz',
    category: 'Casa',
    dueInDays: -1,
  },
  {
    title: 'Fazer as compras do mês',
    description: 'Arroz, café, frutas e produtos de limpeza',
    category: 'Casa',
    dueInDays: 2,
  },
  {
    title: 'Lavar a louça',
    category: 'Casa',
    completed: true,
  },
  {
    title: 'Marcar consulta no dentista',
    category: 'Saúde',
    dueInDays: 10,
  },
  {
    title: 'Treino de corrida',
    description: '5 km no parque',
    category: 'Saúde',
    completed: true,
  },
  {
    title: 'Ligar para a avó',
  },
  {
    title: 'Renovar o passaporte',
    dueInDays: 30,
  },
];

function dateFromToday(days: number): Date {
  const today = new Date();
  return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() + days));
}

async function seed() {
  const prisma = createPrismaClient(config.databaseUrl);

  try {
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: DEMO_USER.email },
        update: { name: DEMO_USER.name, passwordHash },
        create: { name: DEMO_USER.name, email: DEMO_USER.email, passwordHash },
      });

      await tx.todo.deleteMany({ where: { userId: user.id } });
      await tx.category.deleteMany({ where: { userId: user.id } });

      const categoryIds = new Map<string, number>();
      for (const name of CATEGORIES) {
        const category = await tx.category.create({ data: { userId: user.id, name } });
        categoryIds.set(name, category.id);
      }

      for (const todo of TODOS) {
        await tx.todo.create({
          data: {
            userId: user.id,
            title: todo.title,
            description: todo.description ?? null,
            completed: todo.completed ?? false,
            dueDate: todo.dueInDays === undefined ? null : dateFromToday(todo.dueInDays),
            categoryId: todo.category ? (categoryIds.get(todo.category) ?? null) : null,
          },
        });
      }

      return { categories: categoryIds.size, todos: TODOS.length };
    });

    console.log(
      `Seed concluído: ${result.categories} categorias e ${result.todos} tarefas ` +
        `para ${DEMO_USER.email} (senha: ${DEMO_USER.password}).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error) => {
  console.error('Falha ao rodar o seed:', error);
  process.exit(1);
});
