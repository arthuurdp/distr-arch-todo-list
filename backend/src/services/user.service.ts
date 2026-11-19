import { toUserResponse, type UserResponse } from '../dtos/user.dto.js';
import { HttpError } from '../errors.js';
import type { UserRepository } from '../repositories/user.repository.js';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getById(id: number): Promise<UserResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new HttpError(404, 'Usuário não encontrado');
    return toUserResponse(user);
  }
}
