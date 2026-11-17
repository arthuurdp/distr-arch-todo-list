import axios from 'axios'

type ErrorBody = { error?: string; details?: Record<string, string> }

export const API_DOWN = 'Não foi possível falar com a API. Confira se ela está rodando.'

export class ApiError extends Error {
  status: number
  details: Record<string, string>

  constructor(status: number, message: string, details: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.details = details
  }
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError<ErrorBody>(error) && error.response) {
    const { status, data } = error.response
    return new ApiError(status, data?.error ?? API_DOWN, data?.details)
  }
  return new ApiError(0, API_DOWN)
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Algo deu errado. Tente de novo.'
}

export function errorDetails(error: unknown) {
  return error instanceof ApiError ? error.details : {}
}
