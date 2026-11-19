import { client, unwrap } from '@/api/client'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types/user'

export const authService = {
  register: (input: RegisterInput) => client.post<AuthResponse>('/auth/register', input).then(unwrap),
  login: (input: LoginInput) => client.post<AuthResponse>('/auth/login', input).then(unwrap),
  logout: () => client.post<void>('/auth/logout').then(unwrap),
  me: () => client.get<User>('/users/me').then(unwrap),
}
