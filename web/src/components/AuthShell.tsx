import { CheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Brand } from '@/components/Brand'
import { cn } from '@/lib/utils'

const sample = [
  { text: 'Terminar a API em Node.js', done: true },
  { text: 'Escrever os testes do CRUD', done: true },
  { text: 'Apresentar o trabalho para a turma', done: false },
]

type AuthShellProps = {
  title: string
  subtitle: string
  footer: ReactNode
  children: ReactNode
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <Brand />
        <div>
          <p className="max-w-sm font-heading text-4xl leading-tight font-bold">
            O que precisa ser feito hoje?
          </p>
          <ul aria-hidden className="mt-8 grid max-w-sm gap-3">
            {sample.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-base">
                <span
                  className={cn(
                    'grid size-5 shrink-0 place-content-center rounded-full border-2',
                    item.done
                      ? 'border-marker bg-marker text-marker-foreground'
                      : 'border-primary-foreground/60',
                  )}
                >
                  {item.done && <CheckIcon className="size-3" strokeWidth={3.5} />}
                </span>
                <span className={cn(item.done && 'line-through opacity-70')}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm opacity-80">API em Node.js, front-end em React com shadcn/ui.</p>
      </aside>

      <main className="flex flex-col justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-sm">
          <Brand className="mb-10 lg:hidden" />
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  )
}
