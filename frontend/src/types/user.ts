export type User = {
  id: number
  name: string
  email: string
  createdAt: string
}

export type AuthResponse = {
  token: string
  user: User
}

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type LoginInput = {
  email: string
  password: string
}
