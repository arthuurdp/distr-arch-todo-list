import { ListChecksIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormField } from '@/components/FormField'
import { TodoItem } from '@/components/TodoItem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { api, errorDetails, errorMessage } from '@/lib/api'
import type { Category, Todo } from '@/lib/api'

function countLabel(count: number) {
  if (count === 0) return 'Nenhuma tarefa'
  return count === 1 ? '1 tarefa' : `${count} tarefas`
}

function byName(a: Category, b: Category) {
  return a.name.localeCompare(b.name, 'pt-BR')
}

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const [renaming, setRenaming] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [viewing, setViewing] = useState<Category | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setCategories(await api.listCategories())
    } catch (err) {
      setLoadError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const created = await api.createCategory(newName)
      setCategories((current) => [...current, created].sort(byName))
      setNewName('')
      toast.success('Categoria criada')
    } catch (err) {
      setCreateError(errorDetails(err).name ?? errorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  function handleRenamed(saved: Category) {
    setCategories((current) =>
      current.map((category) => (category.id === saved.id ? saved : category)).sort(byName),
    )
    setRenaming(null)
    toast.success('Categoria atualizada')
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await api.deleteCategory(deleting.id)
      setCategories((current) => current.filter((category) => category.id !== deleting.id))
      toast.success('Categoria excluída')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Categorias</h1>
      <p className="mt-1 text-muted-foreground">Agrupe as tarefas por assunto.</p>

      <form onSubmit={handleCreate} noValidate className="mt-6 max-w-md">
        <FormField id="category-name" label="Nova categoria" error={createError}>
          <div className="flex gap-2">
            <Input
              id="category-name"
              value={newName}
              maxLength={50}
              placeholder="Ex.: Faculdade"
              className="bg-card"
              aria-invalid={Boolean(createError)}
              onChange={(event) => setNewName(event.target.value)}
            />
            <Button type="submit" disabled={creating}>
              Criar categoria
            </Button>
          </div>
        </FormField>
      </form>

      {loading ? (
        <p className="mt-10 text-muted-foreground">Carregando categorias…</p>
      ) : loadError ? (
        <div className="mt-10 rounded-xl border bg-card p-6">
          <p role="alert" className="font-medium">
            {loadError}
          </p>
          <Button variant="outline" className="mt-4" onClick={load}>
            Tentar de novo
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Nenhuma categoria ainda. Crie uma acima e escolha-a ao criar uma tarefa.
        </p>
      ) : (
        <ul aria-label="Lista de categorias" className="mt-6 divide-y rounded-xl border bg-card">
          {categories.map((category) => (
            <li key={category.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium wrap-break-word">{category.name}</p>
                <p className="text-sm text-muted-foreground">{countLabel(category.todoCount)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" size="sm" onClick={() => setViewing(category)}>
                  <ListChecksIcon />
                  Ver tarefas
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Renomear "${category.name}"`}
                  onClick={() => setRenaming(category)}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Excluir "${category.name}"`}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleting(category)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={renaming !== null} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear categoria</DialogTitle>
            <DialogDescription>As tarefas da categoria passam a mostrar o novo nome.</DialogDescription>
          </DialogHeader>
          {renaming && (
            <RenameForm
              category={renaming}
              onSaved={handleRenamed}
              onCancel={() => setRenaming(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir categoria?"
        description={`"${deleting?.name ?? ''}" será excluída. As tarefas dela continuam na lista, sem categoria.`}
        confirmLabel="Excluir categoria"
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />

      <Sheet open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {viewing && <CategoryTodos category={viewing} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

type RenameFormProps = {
  category: Category
  onSaved: (category: Category) => void
  onCancel: () => void
}

function RenameForm({ category, onSaved, onCancel }: RenameFormProps) {
  const [name, setName] = useState(category.name)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      onSaved(await api.updateCategory(category.id, name))
    } catch (err) {
      setError(errorDetails(err).name ?? errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <FormField id="rename-category" label="Nome" error={error}>
        <Input
          id="rename-category"
          value={name}
          maxLength={50}
          autoFocus
          aria-invalid={Boolean(error)}
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          Salvar nome
        </Button>
      </DialogFooter>
    </form>
  )
}

function CategoryTodos({ category }: { category: Category }) {
  const [todos, setTodos] = useState<Todo[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .listCategoryTodos(category.id)
      .then(setTodos)
      .catch((err) => setError(errorMessage(err)))
  }, [category.id])

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-heading text-xl">{category.name}</SheetTitle>
        <SheetDescription>Tarefas desta categoria.</SheetDescription>
      </SheetHeader>
      <div className="overflow-y-auto px-4 pb-4">
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : todos === null ? (
          <p className="text-sm text-muted-foreground">Carregando tarefas…</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma tarefa nesta categoria. Escolha-a ao criar ou editar uma tarefa.
          </p>
        ) : (
          <ul aria-label={`Tarefas de ${category.name}`} className="divide-y rounded-xl border bg-card">
            {todos.map((todo) => (
              <TodoItem key={todo.id} todo={{ ...todo, category: null }} />
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
