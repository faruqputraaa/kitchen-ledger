import bcrypt from 'bcrypt';

import UnauthorizedError from '#errors/UnauthorizedError';

import { generateAccessToken } from '#config/jwt';

import userService from '#modules/user/user.service';
import userMapper from '#modules/user/user.mapper';

import refreshTokenService from '#modules/refresh-token/refreshToken.service';

class AuthService {
  async register(dto) {
    const user = await userService.createLocalUser(dto);

    const accessToken = generateAccessToken({
      id: user._id,
      code: user.code,
      role: user.role,
    });

    const refreshToken =
      await refreshTokenService.create({
        userId: user._id,
      });

    return {
      accessToken,
      refreshToken,
      user: userMapper.toResponse(user),
    };
  }

  async login({
    email,
    password,
    ipAddress,
    userAgent,
  }) {
    const user =
      await userService.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedError(
        'Invalid email or password'
      );
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      throw new UnauthorizedError(
        'Invalid email or password'
      );
    }

    await userService.updateLastLogin(user._id);

    const accessToken =
      generateAccessToken({
        id: user._id,
        code: user.code,
        role: user.role,
      });

    const refreshToken =
      await refreshTokenService.create({
        userId: user._id,
        ipAddress,
        userAgent,
      });

    return {
      accessToken,
      refreshToken,
      user: userMapper.toResponse(user),
    };
  }

  async refresh(refreshToken) {
    const session =
      await refreshTokenService.findByToken(
        refreshToken
      );

    if (!session) {
      throw new UnauthorizedError(
        'Invalid refresh token'
      );
    }
        if (session.revokedAt) {
      throw new UnauthorizedError(
        'Refresh token has been revoked'
      );
    }

    if (
      session.expiresAt &&
      session.expiresAt.getTime() < Date.now()
    ) {
      throw new UnauthorizedError(
        'Refresh token has expired'
      );
    }

    const user =
      await userService.findById(session.userId);

    if (!user) {
      throw new UnauthorizedError(
        'User not found'
      );
    }

    await refreshTokenService.delete(session._id);

    const newRefreshToken =
      await refreshTokenService.create({
        userId: user._id,
      });

    const accessToken =
      generateAccessToken({
        id: user._id,
        code: user.code,
        role: user.role,
      });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: userMapper.toResponse(user),
    };
  }

  async logout(refreshToken) {
    const session =
      await refreshTokenService.findByToken(
        refreshToken
      );

    if (session) {
      await refreshTokenService.delete(session._id);
    }
  }

  async logoutAll(userId) {
    await refreshTokenService.deleteAllByUser(
      userId
    );
  }

  async googleLogin(user) {
    await userService.updateLastLogin(user._id);

    const accessToken = generateAccessToken({
      id: user._id,
      code: user.code,
      role: user.role,
    });

    const refreshToken =
      await refreshTokenService.create({
        userId: user._id,
      });

    return {
      accessToken,
      refreshToken,
      user: userMapper.toResponse(user),
    };
  }
}

export default new AuthService();
