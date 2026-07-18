import { Router } from 'express';

import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';

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
  validate(registerSchema),
  register
);

router.post(
  '/login',
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