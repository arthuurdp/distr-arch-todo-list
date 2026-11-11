import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AuthShell } from '@/components/AuthShell'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errorDetails, errorMessage } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export function RegisterPage() {
  const { user, register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setFieldErrors({})
    try {
      await register(name, email, password)
    } catch (err) {
      const details = errorDetails(err)
      setFieldErrors(details)
      if (Object.keys(details).length === 0) setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Suas tarefas e categorias ficam visíveis só para você."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
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
        <FormField id="name" label="Nome" error={fieldErrors.name}>
          <Input
            id="name"
            autoComplete="name"
            className="h-10"
            value={name}
            aria-invalid={Boolean(fieldErrors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </FormField>
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
            autoComplete="new-password"
            className="h-10"
            value={password}
            aria-invalid={Boolean(fieldErrors.password)}
            aria-describedby="password-hint"
            onChange={(event) => setPassword(event.target.value)}
          />
          <p id="password-hint" className="text-sm text-muted-foreground">
            Mínimo de 8 caracteres.
          </p>
        </FormField>
        <Button type="submit" size="lg" className="h-10" disabled={submitting}>
          {submitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  )
}
