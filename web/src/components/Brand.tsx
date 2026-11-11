import { CheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-heading text-lg font-bold', className)}>
      <span
        aria-hidden
        className="grid size-6 place-content-center rounded-md bg-marker text-marker-foreground"
      >
        <CheckIcon className="size-4" strokeWidth={3} />
      </span>
      Tarefas
    </span>
  )
}
