import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorDetails, errorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to={location.state?.from ?? '/'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setFieldErrors({})
    try {
      await login(email, password)
    } catch (err) {
      const details = errorDetails(err)
      setFieldErrors(details)
      if (Object.keys(details).length === 0) setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Use o email e a senha do seu cadastro."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/cadastro" className="font-medium text-primary underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="grid gap-4">
        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        <FormField id="email" label="Email" error={fieldErrors.email}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-10"
            value={email}
            aria-invalid={Boolean(fieldErrors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField id="password" label="Senha" error={fieldErrors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-10"
            value={password}
            aria-invalid={Boolean(fieldErrors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <Button type="submit" size="lg" className="h-10" disabled={submitting}>
          {submitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
