import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

type FormFieldProps = {
  id: string
  label: string
  error?: string
  optional?: boolean
  children: ReactNode
}

export function FormField({ id, label, error, optional, children }: FormFieldProps) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
