import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { api, errorDetails, errorMessage } from '@/lib/api'
import type { Category, Todo } from '@/lib/api'

const NO_CATEGORY = 'none'

type TodoFormDialogProps = {
  open: boolean
  todo: Todo | null
  categories: Category[]
  onOpenChange: (open: boolean) => void
  onSaved: (todo: Todo, created: boolean) => void
}

export function TodoFormDialog({ open, todo, categories, onOpenChange, onSaved }: TodoFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{todo ? 'Editar tarefa' : 'Nova tarefa'}</DialogTitle>
          <DialogDescription>
            {todo ? 'Altere os dados e salve.' : 'Só o título é obrigatório.'}
          </DialogDescription>
        </DialogHeader>
        <TodoForm
          todo={todo}
          categories={categories}
          onSaved={onSaved}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

type TodoFormProps = {
  todo: Todo | null
  categories: Category[]
  onSaved: (todo: Todo, created: boolean) => void
  onCancel: () => void
}

function TodoForm({ todo, categories, onSaved, onCancel }: TodoFormProps) {
  const [title, setTitle] = useState(todo?.title ?? '')
  const [description, setDescription] = useState(todo?.description ?? '')
  const [dueDate, setDueDate] = useState(todo?.dueDate ?? '')
  const [categoryId, setCategoryId] = useState(
    todo?.categoryId ? String(todo.categoryId) : NO_CATEGORY,
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFieldErrors({})

    const input = {
      title,
      description: description.trim() || null,
      dueDate: dueDate || null,
      categoryId: categoryId === NO_CATEGORY ? null : Number(categoryId),
    }

    try {
      const saved = todo
        ? await api.updateTodo(todo.id, { ...input, completed: todo.completed })
        : await api.createTodo(input)
      onSaved(saved, !todo)
    } catch (err) {
      const details = errorDetails(err)
      setFieldErrors(details)
      if (Object.keys(details).length === 0) toast.error(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <FormField id="todo-title" label="Título" error={fieldErrors.title}>
        <Input
          id="todo-title"
          value={title}
          maxLength={120}
          autoFocus
          aria-invalid={Boolean(fieldErrors.title)}
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormField>

      <FormField id="todo-description" label="Descrição" optional error={fieldErrors.description}>
        <Textarea
          id="todo-description"
          rows={3}
          maxLength={1000}
          value={description}
          aria-invalid={Boolean(fieldErrors.description)}
          onChange={(event) => setDescription(event.target.value)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="todo-due-date" label="Prazo" optional error={fieldErrors.dueDate}>
          <Input
            id="todo-due-date"
            type="date"
            value={dueDate}
            aria-invalid={Boolean(fieldErrors.dueDate)}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </FormField>

        <FormField id="todo-category" label="Categoria" error={fieldErrors.categoryId}>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="todo-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {todo ? 'Salvar alterações' : 'Criar tarefa'}
        </Button>
      </DialogFooter>
    </form>
  )
}
