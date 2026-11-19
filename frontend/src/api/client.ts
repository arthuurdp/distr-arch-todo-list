import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { toApiError } from '@/api/errors'
import { notifyUnauthorized, refreshSession, session } from '@/api/session'

type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean }

export const client = axios.create({ baseURL: '/api/v1' })

client.interceptors.request.use((config) => {
  const token = session.token()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    const config = axios.isAxiosError(error) ? (error.config as RetriableConfig | undefined) : undefined
    const sentToken = Boolean(config?.headers?.Authorization)
    const expired = axios.isAxiosError(error) && error.response?.status === 401

    if (expired && sentToken && config && !config.retried) {
      config.retried = true
      const renewed = await refreshSession().catch(() => null)
      if (renewed) return client(config)
      notifyUnauthorized()
    }

    throw toApiError(error)
  },
)

export const unwrap = <T>(response: AxiosResponse<T>) => response.data
