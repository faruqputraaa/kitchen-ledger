import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';

import { setRefreshCookie, clearRefreshCookie } from '#shared/utils/cookie';

import UnauthorizedError from '#errors/UnauthorizedError';

import env from '#config/env';
import passport from 'passport';

import userService from '#modules/user/user.service';
import userMapper from '#modules/user/user.mapper';

import authService from './auth.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.validated.body);

  setRefreshCookie(res, result.refreshToken);

  delete result.refreshToken;

  return successResponse(res, {
    statusCode: 201,
    message: 'User registered successfully',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    ...req.validated.body,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  setRefreshCookie(res, result.refreshToken);

  delete result.refreshToken;

  return successResponse(res, {
    message: 'Login successful',
    data: result,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new UnauthorizedError('Refresh token not found');
  }

  const result = await authService.refresh(refreshToken);

  setRefreshCookie(res, result.refreshToken);

  delete result.refreshToken;

  return successResponse(res, {
    message: 'Token refreshed',
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  clearRefreshCookie(res);

  return successResponse(res, {
    message: 'Logout successful',
  });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);

  clearRefreshCookie(res);

  return successResponse(res, {
    message: 'Logout from all devices successful',
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await userService.findCurrentUser(req.user.id);

  return successResponse(res, {
    data: userMapper.toResponse(user),
  });
});

export const googleAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })(req, res, next);
};

export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(`${env.clientUrl}/login?error=oauth_failed`);
    }

    try {
      const result = await authService.googleLogin(user);

      setRefreshCookie(res, result.refreshToken);

      const query = new URLSearchParams({
        token: result.accessToken,
      }).toString();

      return res.redirect(`${env.clientUrl}/oauth/callback?${query}`);
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
};
