import { Router } from 'express';

import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';

import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
} from './menu.controller.js';

import {
  createMenuSchema,
  updateMenuSchema,
  menuIdSchema,
  menuQuerySchema,
} from './menu.validation.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(menuQuerySchema),
  getMenus
);

router.get(
  '/:id',
  validate(menuIdSchema),
  getMenuById
);

router.post(
  '/',
  roleMiddleware('OWNER', 'STAFF'),
  validate(createMenuSchema),
  createMenu
);

router.put(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(updateMenuSchema),
  updateMenu
);

router.delete(
  '/:id',
  roleMiddleware('OWNER'),
  validate(menuIdSchema),
  deleteMenu
);

export default router;