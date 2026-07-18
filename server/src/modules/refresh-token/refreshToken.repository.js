import RefreshToken from './refreshToken.model.js';

class RefreshTokenRepository {
  create(payload, session = null) {
    return RefreshToken.create(
      [payload],
      { session }
    ).then((result) => result[0]);
  }

  findByToken(token) {
    return RefreshToken.findOne({
      token,
    });
  }

  revoke(
    id,
    reason,
    session = null
  ) {
    return RefreshToken.findByIdAndUpdate(
      id,
      {
        revokedAt: new Date(),
        revokedReason: reason,
      },
      {
        new: true,
        session,
      }
    );
  }

  delete(
    id,
    session = null
  ) {
    return RefreshToken.findByIdAndDelete(
      id,
      { session }
    );
  }

  deleteAllByUser(
    userId,
    session = null
  ) {
    return RefreshToken.deleteMany(
      {
        userId,
      },
      {
        session,
      }
    );
  }
}

export default new RefreshTokenRepository();