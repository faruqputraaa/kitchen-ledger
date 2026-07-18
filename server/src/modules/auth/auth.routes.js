import { Router } from 'express';

import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import authRateLimit from '#middlewares/rateLimit.middleware';


import {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
} from './auth.controller.js';

import {
  registerSchema,
  loginSchema,
} from './auth.validation.js';

const router = Router();

router.post(
  '/register',
  authRateLimit,
  validate(registerSchema),
  register
);

router.post(
  '/login',
  authRateLimit,
  validate(loginSchema),
  login
);

router.post(
  '/refresh',
  refresh
);

router.post(
  '/logout',
  logout
);

router.post(
  '/logout-all',
  authMiddleware,
  logoutAll
);

router.get(
  '/me',
  authMiddleware,
  me
);

export default router;