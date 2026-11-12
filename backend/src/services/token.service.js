import jwt from 'jsonwebtoken';

export class TokenService {
  constructor({ jwtSecret, jwtExpiresIn }) {
    this.secret = jwtSecret;
    this.expiresIn = jwtExpiresIn;
  }

  sign(userId) {
    return jwt.sign({}, this.secret, { subject: String(userId), expiresIn: this.expiresIn });
  }

  verify(token) {
    try {
      return Number(jwt.verify(token, this.secret).sub);
    } catch {
      return null;
    }
  }
}
