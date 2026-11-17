import axios from 'axios'
import { toApiError } from '@/api/errors'
import type { AuthResponse } from '@/types/user'

const SESSION_KEY = 'todolist.session'
const LEGACY_TOKEN_KEY = 'todolist.token'

let accessToken: string | null = null
let onUnauthorized = () => {}
let refreshing: Promise<AuthResponse | null> | null = null

localStorage.removeItem(LEGACY_TOKEN_KEY)

export const session = {
  token: () => accessToken,
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

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export function notifyUnauthorized() {
  onUnauthorized()
}

const refreshClient = axios.create({ baseURL: '/api' })

function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  return navigator.locks ? navigator.locks.request('todolist.refresh', task) : task()
}

async function requestNewSession(): Promise<AuthResponse | null> {
  try {
    const { data } = await refreshClient.post<AuthResponse>('/users/refresh')
    session.start(data.token)
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null
    throw toApiError(error)
  }
}

export function refreshSession(): Promise<AuthResponse | null> {
  refreshing ??= withRefreshLock(requestNewSession).finally(() => {
    refreshing = null
  })
  return refreshing
}
