import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import type { ReactNode } from 'react'
import { Brand } from '@/components/Brand'
import { Switch } from '@/components/ui/switch'

type AuthShellProps = {
  title: string
  subtitle: string
  footer: ReactNode
  children: ReactNode
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <div className="grid min-h-svh">
      <main className="flex flex-col justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="mb-6 flex justify-end">
            <Switch
              size="lg"
              aria-label="Modo escuro"
              checked={isDark}
              onCheckedChange={(dark) => setTheme(dark ? 'dark' : 'light')}
              thumbIcon={isDark ? <MoonIcon aria-hidden /> : <SunIcon aria-hidden />}
            />
          </div>
          <Brand className="mb-10 hidden" />
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-6 text-sm text-muted-foreground">{footer}</p>
        </div>
      </main>
    </div>
  )
}
