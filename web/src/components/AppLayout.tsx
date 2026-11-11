import { LogOutIcon } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Brand } from '@/components/Brand'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const links = [
  { to: '/', label: 'Tarefas' },
  { to: '/categorias', label: 'Categorias' },
  { to: '/sobre', label: 'Sobre' },
]

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function MainNav({ className }: { className?: string }) {
  return (
    <nav aria-label="Principal" className={cn('flex items-center gap-1', className)}>
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          className={({ isActive }) =>
            cn(
              'rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  if (!user) return null

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-14 w-full max-w-4xl items-center gap-6 px-4">
          <Link to="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Brand />
          </Link>
          <MainNav className="hidden sm:flex" />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Abrir menu da conta"
              className="ml-auto rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Avatar>
                <AvatarFallback className="bg-secondary font-medium">
                  {initials(user.name)}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel>
                <span className="block font-medium text-foreground">{user.name}</span>
                <span className="block font-normal text-muted-foreground">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={logout}>
                <LogOutIcon />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="border-t px-4 py-2 sm:hidden">
          <MainNav />
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t bg-card">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-1 px-4 py-4 text-sm text-muted-foreground sm:flex-row text-center lg:justify-between">
          <p>Lista de tarefas feita com Node.js e React.</p>
          <Link to="/sobre" className="underline-offset-4 hover:text-foreground hover:underline">
            Quem fez?
          </Link>
        </div>
      </footer>
    </div>
  )
}
