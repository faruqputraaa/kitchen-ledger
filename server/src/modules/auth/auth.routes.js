import { Router } from 'express';
import passport from 'passport';

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
  googleAuth,
  googleCallback,
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

router.get(
  '/google',
  googleAuth
);

router.get(
  '/google/callback',
  googleCallback
);

// TEST ONLY: balikin token sebagai JSON (tanpa frontend)
router.get('/oauth/callback', (req, res) => {
  res.json({ token: req.query.token ?? null });
});

export default router;
