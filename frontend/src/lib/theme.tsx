import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ReactNode } from 'react'

export const THEME_STORAGE_KEY = 'todolist.theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
