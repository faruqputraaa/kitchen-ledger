import crypto from 'node:crypto';

import refreshTokenRepository from './refreshToken.repository.js';

class RefreshTokenService {
  generateToken() {
    return crypto.randomBytes(64).toString('hex');
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async create({ userId, ipAddress, userAgent, session = null }) {
    const plainToken = this.generateToken();

    const hashedToken = this.hashToken(plainToken);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await refreshTokenRepository.create(
      {
        userId,
        token: hashedToken,
        expiresAt,
        ipAddress,
        userAgent,
      },
      session
    );

    return plainToken;
  }

  async findByToken(token) {
    return refreshTokenRepository.findByToken(this.hashToken(token));
  }

  revoke(id, reason, session = null) {
    return refreshTokenRepository.revoke(id, reason, session);
  }

  delete(id, session = null) {
    return refreshTokenRepository.delete(id, session);
  }

  deleteAllByUser(userId, session = null) {
    return refreshTokenRepository.deleteAllByUser(userId, session);
  }
}

export default new RefreshTokenService();
