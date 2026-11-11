import { CalendarIcon, PencilIcon, TagIcon, Trash2Icon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { Todo } from '@/lib/api'
import { formatDate, isOverdue } from '@/lib/dates'
import { cn } from '@/lib/utils'

type TodoItemProps = {
  todo: Todo
  onToggle?: (todo: Todo) => void
  onEdit?: (todo: Todo) => void
  onDelete?: (todo: Todo) => void
}

export function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  const overdue = !todo.completed && todo.dueDate !== null && isOverdue(todo.dueDate)

  return (
    <li className="flex items-start gap-3 px-4 py-3.5">
      {onToggle && (
        <Checkbox
          checked={todo.completed}
          onCheckedChange={() => onToggle(todo)}
          aria-label={
            todo.completed ? `Reabrir "${todo.title}"` : `Marcar "${todo.title}" como concluída`
          }
          className="mt-0.5 size-5 rounded-full"
        />
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-medium wrap-break-word',
            todo.completed && 'text-muted-foreground line-through',
          )}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="mt-0.5 text-sm wrap-break-word text-muted-foreground">{todo.description}</p>
        )}
        {(todo.category || todo.dueDate) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {todo.category && (
              <Badge variant="secondary">
                <TagIcon />
                {todo.category.name}
              </Badge>
            )}
            {todo.dueDate && (
              <Badge variant={overdue ? 'destructive' : 'outline'}>
                <CalendarIcon />
                {overdue ? 'Venceu em' : 'Até'} {formatDate(todo.dueDate)}
              </Badge>
            )}
          </div>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar "${todo.title}"`}
              onClick={() => onEdit(todo)}
            >
              <PencilIcon />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir "${todo.title}"`}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(todo)}
            >
              <Trash2Icon />
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
