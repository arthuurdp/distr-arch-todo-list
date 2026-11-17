import { useSearchParams } from 'react-router-dom'
import { PlusIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { TodoFormDialog } from '@/components/TodoFormDialog'
import { TodoItem } from '@/components/TodoItem'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { errorMessage } from '@/api/errors'
import { categoryService } from '@/services/category.service'
import { todoService } from '@/services/todo.service'
import { TodoPagination } from '@/components/TodoPagination'
import type { Category } from '@/types/category'
import type { Page } from '@/types/page'
import type { Todo, TodoFilters, TodoSummary } from '@/types/todo'

type StatusFilter = 'all' | 'pending' | 'done'

const ALL_CATEGORIES = 'all'
const NO_CATEGORY = 'none'

const STATUS_VALUES: StatusFilter[] = ['all', 'pending', 'done']

function parseStatus(value: string | null): StatusFilter {
  return STATUS_VALUES.includes(value as StatusFilter) ? (value as StatusFilter) : 'all'
}

function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

const EMPTY_PAGE: Page<Todo> = { content: [], page: 1, size: 10, totalElements: 0, totalPages: 0 }

export function TodosPage() {
  const [todoPage, setTodoPage] = useState<Page<Todo>>(EMPTY_PAGE)
  const [listLoaded, setListLoaded] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [summary, setSummary] = useState<TodoSummary>({ total: 0, completed: 0 })
  const [ready, setReady] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [searchParams, setSearchParams] = useSearchParams()

  const status = parseStatus(searchParams.get('status'))
  const page = parsePage(searchParams.get('page'))
  const todos = todoPage.content

  const categoryName = searchParams.get('category')?.toLowerCase()
  const selectedCategory = categoryName
    ? categories.find((category) => category.name.toLowerCase() === categoryName)
    : undefined
  const categoryFilter =
    searchParams.get('uncategorized') === 'true'
      ? NO_CATEGORY
      : selectedCategory
        ? String(selectedCategory.id)
        : ALL_CATEGORIES

  function updateParams(update: (params: URLSearchParams) => void) {
    setSearchParams(
      (params) => {
        update(params)
        return params
      },
      { replace: true },
    )
  }

  function setPage(value: number) {
    updateParams((params) => {
      if (value <= 1) params.delete('page')
      else params.set('page', String(value))
    })
  }

  function hrefForPage(value: number) {
    const params = new URLSearchParams(searchParams)
    if (value <= 1) params.delete('page')
    else params.set('page', String(value))
    const query = params.toString()
    return query ? `?${query}` : '?'
  }

  const setStatus = (value: StatusFilter) =>
    updateParams((params) => {
      params.delete('page')
      if (value === 'all') params.delete('status')
      else params.set('status', value)
    })

  const setCategoryFilter = (value: string) =>
    updateParams((params) => {
      params.delete('page')
      params.delete('category')
      params.delete('uncategorized')
      if (value === NO_CATEGORY) {
        params.set('uncategorized', 'true')
        return
      }
      const category = categories.find((item) => String(item.id) === value)
      if (category) params.set('category', category.name)
    })

  const filters = useMemo<TodoFilters>(
    () => ({
      completed: status === 'all' ? undefined : status === 'done',
      categoryId:
        categoryFilter === ALL_CATEGORIES
          ? undefined
          : categoryFilter === NO_CATEGORY
            ? 'none'
            : Number(categoryFilter),
      page: page > 1 ? page : undefined,
    }),
    [status, categoryFilter, page],
  )

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Todo | null>(null)
  const [deleting, setDeleting] = useState<Todo | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [loadedCategories, loadedSummary] = await Promise.all([
        categoryService.list(),
        todoService.summary(),
      ])
      setCategories(loadedCategories)
      setSummary(loadedSummary)
      setReady(true)
      setReloadKey((key) => key + 1)
    } catch (err) {
      setLoadError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!ready) return
    let ignore = false

    todoService
      .list(filters)
      .then((loaded) => {
        if (ignore) return
        setTodoPage(loaded)
        setListLoaded(true)
      })
      .catch((err) => {
        if (!ignore) setLoadError(errorMessage(err))
      })

    return () => {
      ignore = true
    }
  }, [ready, filters, reloadKey])

  const refresh = useCallback(async () => {
    try {
      setSummary(await todoService.summary())
      setReloadKey((key) => key + 1)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }, [])

  const lastPage = Math.max(todoPage.totalPages, 1)
  const outOfRange = listLoaded && todos.length === 0 && page > lastPage

  useEffect(() => {
    if (outOfRange) setPage(lastPage)
  }, [outOfRange, lastPage])

  const firstShown = (todoPage.page - 1) * todoPage.size + 1
  const lastShown = firstShown + todos.length - 1

  const progress =
    summary.total === 0 ? 0 : Math.round((summary.completed / summary.total) * 100)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(todo: Todo) {
    setEditing(todo)
    setFormOpen(true)
  }

  function handleSaved(_saved: Todo, created: boolean) {
    setFormOpen(false)
    toast.success(created ? 'Tarefa criada' : 'Tarefa atualizada')
    refresh()
  }

  async function handleToggle(todo: Todo) {
    try {
      await todoService.update(todo.id, {
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate,
        categoryId: todo.categoryId,
        completed: !todo.completed,
      })
      await refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await todoService.remove(deleting.id)
      toast.success('Tarefa excluída')
      await refresh()
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
          {summary.total > 0 && (
            <p className="mt-1 text-muted-foreground" aria-live="polite">
              {summary.completed} de {summary.total}{' '}
              {summary.total === 1 ? 'concluída' : 'concluídas'}
            </p>
          )}
        </div>
        <Button size="lg" onClick={openCreate}>
          <PlusIcon />
          Nova tarefa
        </Button>
      </div>

      {summary.total > 0 && (
        <Progress value={progress} aria-label="Progresso das tarefas" className="mt-4 h-1.5" />
      )}

      {loading || (!listLoaded && !loadError) ? (
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
      ) : summary.total === 0 ? (
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

          {outOfRange ? null : todos.length === 0 ? (
            <p className="mt-8 text-muted-foreground">Nenhuma tarefa com esses filtros.</p>
          ) : (
            <>
              <ul aria-label="Lista de tarefas" className="mt-4 divide-y rounded-xl border bg-card">
                {todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={handleToggle}
                    onEdit={openEdit}
                    onDelete={setDeleting}
                  />
                ))}
              </ul>

              <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
                {todoPage.totalPages > 1
                  ? `Mostrando ${firstShown}–${lastShown} de ${todoPage.totalElements} tarefas`
                  : `${todoPage.totalElements} ${todoPage.totalElements === 1 ? 'tarefa' : 'tarefas'}`}
              </p>

              {todoPage.totalPages > 1 && (
                <TodoPagination
                  page={todoPage.page}
                  totalPages={todoPage.totalPages}
                  hrefFor={hrefForPage}
                  onPageChange={setPage}
                />
              )}
            </>
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
