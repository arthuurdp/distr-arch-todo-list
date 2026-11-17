export type User = {
  id: number
  name: string
  email: string
  createdAt: string
}

export type Category = {
  id: number
  name: string
  todoCount: number
  createdAt: string
}

export type Todo = {
  id: number
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  categoryId: number | null
  category: { id: number; name: string } | null
  createdAt: string
  updatedAt: string
}

export type TodoInput = {
  title: string
  description: string | null
  dueDate: string | null
  categoryId: number | null
}

export type AuthResponse = { token: string; user: User }

export class ApiError extends Error {
  status: number
  details: Record<string, string>

  constructor(status: number, message: string, details: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.details = details
  }
}

const SESSION_KEY = 'todolist.session'
const LEGACY_TOKEN_KEY = 'todolist.token'

let accessToken: string | null = null

localStorage.removeItem(LEGACY_TOKEN_KEY)

export const session = {
  mayExist: () => localStorage.getItem(SESSION_KEY) !== null,
  start(token: string) {
    accessToken = token
    localStorage.setItem(SESSION_KEY, '1')
  },
  clear() {
    accessToken = null
    localStorage.removeItem(SESSION_KEY)
  },
}

let onUnauthorized = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

const API_DOWN = 'Não foi possível falar com a API. Confira se ela está rodando.'

let refreshing: Promise<AuthResponse | null> | null = null

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  return navigator.locks ? navigator.locks.request('todolist.refresh', task) : task()
}

async function requestNewSession(): Promise<AuthResponse | null> {
  let res: Response
  try {
    res = await fetch('/api/users/refresh', { method: 'POST' })
  } catch {
    throw new ApiError(0, API_DOWN)
  }

  if (res.status === 401) return null
  if (!res.ok) throw new ApiError(res.status, API_DOWN)

  const data = (await res.json()) as AuthResponse
  session.start(data.token)
  return data
}

export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= withRefreshLock(requestNewSession).finally(() => {
    refreshing = null
  })
  return refreshing
}

async function request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
  const token = accessToken
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, API_DOWN)
  }

  if (res.status === 204) return undefined as T

  if (res.status === 401 && token && retry) {
    const renewed = await refreshSession().catch(() => null)
    if (renewed) return request<T>(method, path, body, false)
    onUnauthorized()
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? API_DOWN, data?.details)
  }
  return data as T
}

export const api = {
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>('POST', '/users/register', data),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('POST', '/users/login', data),
  me: () => request<User>('GET', '/users/me'),
  logout: () => request<void>('POST', '/users/logout'),

  listCategories: () => request<Category[]>('GET', '/categories'),
  createCategory: (name: string) => request<Category>('POST', '/categories', { name }),
  updateCategory: (id: number, name: string) =>
    request<Category>('PUT', `/categories/${id}`, { name }),
  deleteCategory: (id: number) => request<void>('DELETE', `/categories/${id}`),
  listCategoryTodos: (id: number) => request<Todo[]>('GET', `/categories/${id}/todos`),

  listTodos: () => request<Todo[]>('GET', '/todos'),
  createTodo: (data: TodoInput) => request<Todo>('POST', '/todos', data),
  updateTodo: (id: number, data: TodoInput & { completed: boolean }) =>
    request<Todo>('PUT', `/todos/${id}`, data),
  deleteTodo: (id: number) => request<void>('DELETE', `/todos/${id}`),
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Algo deu errado. Tente de novo.'
}

export function errorDetails(error: unknown) {
  return error instanceof ApiError ? error.details : {}
}
