import bcrypt from 'bcryptjs';
import { HttpError } from '../errors.js';

export class UserService {
  constructor(userRepository, tokenService) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  async register({ name, email, password }) {
    if (this.userRepository.findByEmail(email)) {
      throw new HttpError(409, 'Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ name, email, passwordHash });

    return { token: this.tokenService.sign(user.id), user };
  }

  async login({ email, password }) {
    const user = this.userRepository.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new HttpError(401, 'Email ou senha incorretos');
    }

    return { token: this.tokenService.sign(user.id), user };
  }

  getById(id) {
    const user = this.userRepository.findById(id);
    if (!user) throw new HttpError(404, 'Usuário não encontrado');
    return user;
  }
}
