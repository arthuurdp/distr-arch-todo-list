import { Link, useLocation } from 'react-router-dom'
import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'

export function NotFoundPage() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  return (
    <main className="grid min-h-svh place-content-center px-6 py-10 text-center">
      <Brand className="mx-auto mb-10" />
      <p className="font-heading text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="mt-4 text-3xl font-bold">Página não encontrada</h1>
      <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
        O endereço <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{pathname}</code>{' '}
        não existe. Confira se digitou certo ou volte para o início.
      </p>
      <Button asChild size="lg" className="mx-auto mt-8">
        <Link to={user ? '/' : '/login'}>{user ? 'Ir para as tarefas' : 'Ir para o login'}</Link>
      </Button>
    </main>
  )
}
