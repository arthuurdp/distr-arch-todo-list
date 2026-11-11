import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { members } from '@/data/members'

const stack = [
  { area: 'API', items: 'Node.js, Express, SQLite e autenticação com JWT' },
  { area: 'Front-end', items: 'React, Vite, Tailwind CSS e componentes shadcn/ui' },
  { area: 'Testes', items: 'Vitest com Supertest na API e Playwright no front-end' },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold sm:text-4xl">Sobre o projeto</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Uma lista de tarefas com cadastro e login. Cada pessoa organiza as próprias tarefas em
        categorias, marca o que já concluiu e acompanha os prazos.
      </p>

      <h2 className="mt-10 text-xl font-semibold">Quem fez</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {members.map((member) => (
          <li key={member.name}>
            <Card className="h-full">
              <CardContent className="flex items-center gap-4">
                <Avatar className="size-12">
                  {member.github && (
                    <AvatarImage src={`https://github.com/${member.github}.png?size=96`} alt="" />
                  )}
                  <AvatarFallback className="bg-secondary font-medium">
                    {initials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  {member.github && (
                    <a
                      href={`https://github.com/${member.github}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      github.com/{member.github}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-xl font-semibold">Como foi feito</h2>
      <dl className="mt-4 divide-y rounded-xl border bg-card">
        {stack.map((row) => (
          <div key={row.area} className="grid gap-1 px-4 py-3 sm:grid-cols-[8rem_1fr]">
            <dt className="font-medium">{row.area}</dt>
            <dd className="text-muted-foreground">{row.items}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
