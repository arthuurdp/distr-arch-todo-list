import { client, unwrap } from '@/api/client'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/user'

export const authService = {
  register: (input: RegisterInput) => client.post<AuthResponse>('/users/register', input).then(unwrap),
  login: (input: LoginInput) => client.post<AuthResponse>('/users/login', input).then(unwrap),
  logout: () => client.post<void>('/users/logout').then(unwrap),
  me: () => client.get<User>('/users/me').then(unwrap),
}
