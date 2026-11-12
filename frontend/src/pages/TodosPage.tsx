import { PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TodoFormDialog } from '@/components/TodoFormDialog'
import { TodoItem } from '@/components/TodoItem'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, errorMessage } from '@/lib/api'
import type { Category, Todo } from '@/lib/api'

type StatusFilter = 'all' | 'pending' | 'done'

const ALL_CATEGORIES = 'all'
const NO_CATEGORY = 'none'

export function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState<Todo | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [loadedTodos, loadedCategories] = await Promise.all([
        api.listTodos(),
        api.listCategories(),
      ])
      setTodos(loadedTodos)
      setCategories(loadedCategories)
    } catch (err) {
      setLoadError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const doneCount = todos.filter((todo) => todo.completed).length
  const progress = todos.length === 0 ? 0 : Math.round((doneCount / todos.length) * 100)

  const visible = useMemo(
    () =>
      todos.filter((todo) => {
        if (status === 'pending' && todo.completed) return false
        if (status === 'done' && !todo.completed) return false
        if (categoryFilter === NO_CATEGORY) return todo.categoryId === null
        if (categoryFilter !== ALL_CATEGORIES) return todo.categoryId === Number(categoryFilter)
        return true
      }),
    [todos, status, categoryFilter],
  )

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(todo: Todo) {
    setEditing(todo)
    setFormOpen(true)
  }

  function handleSaved(saved: Todo, created: boolean) {
    setTodos((current) =>
      created ? [saved, ...current] : current.map((todo) => (todo.id === saved.id ? saved : todo)),
    )
    setFormOpen(false)
    toast.success(created ? 'Tarefa criada' : 'Tarefa atualizada')
  }

  async function handleToggle(todo: Todo) {
    try {
      const saved = await api.updateTodo(todo.id, {
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        categoryId: todo.categoryId,
        completed: !todo.completed,
      })
      setTodos((current) => current.map((item) => (item.id === saved.id ? saved : item)))
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await api.deleteTodo(deleting.id)
      setTodos((current) => current.filter((todo) => todo.id !== deleting.id))
      toast.success('Tarefa excluída')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Tarefas</h1>
          {todos.length > 0 && (
            <p className="mt-1 text-muted-foreground" aria-live="polite">
              {doneCount} de {todos.length} {todos.length === 1 ? 'concluída' : 'concluídas'}
            </p>
          )}
        </div>
        <Button size="lg" onClick={openCreate}>
          <PlusIcon />
          Nova tarefa
        </Button>
      </div>

      {todos.length > 0 && (
        <Progress value={progress} aria-label="Progresso das tarefas" className="mt-4 h-1.5" />
      )}

      {loading ? (
        <p className="mt-10 text-muted-foreground">Carregando tarefas…</p>
      ) : loadError ? (
        <div className="mt-10 rounded-xl border bg-card p-6">
          <p role="alert" className="font-medium">
            {loadError}
          </p>
          <Button variant="outline" className="mt-4" onClick={load}>
            Tentar de novo
          </Button>
        </div>
      ) : todos.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed bg-card p-8 text-center sm:p-12">
          <h2 className="text-xl font-semibold">Nenhuma tarefa por aqui</h2>
          <p className="mt-1 text-muted-foreground">Crie a primeira para começar a lista.</p>
          <Button className="mt-5" onClick={openCreate}>
            <PlusIcon />
            Criar a primeira tarefa
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
              <TabsList aria-label="Filtrar por situação">
                <TabsTrigger value="all" className="px-3">
                  Todas
                </TabsTrigger>
                <TabsTrigger value="pending" className="px-3">
                  Pendentes
                </TabsTrigger>
                <TabsTrigger value="done" className="px-3">
                  Concluídas
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filtrar por categoria" className="min-w-48 bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_CATEGORIES}>Todas as categorias</SelectItem>
                <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {visible.length === 0 ? (
            <p className="mt-8 text-muted-foreground">Nenhuma tarefa com esses filtros.</p>
          ) : (
            <ul aria-label="Lista de tarefas" className="mt-4 divide-y rounded-xl border bg-card">
              {visible.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={openEdit}
                  onDelete={setDeleting}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <TodoFormDialog
        open={formOpen}
        todo={editing}
        categories={categories}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir tarefa?"
        description={`"${deleting?.title ?? ''}" será excluída. Não dá para desfazer.`}
        confirmLabel="Excluir tarefa"
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </>
  )
}
