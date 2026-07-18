import { Router } from 'express';

import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';
import validate from '#middlewares/validation.middleware';

import {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} from './unit.controller.js';

import {
  createUnitSchema,
  updateUnitSchema,
  unitIdSchema,
  unitQuerySchema,
} from './unit.validation.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(unitQuerySchema),
  getUnits
);

router.get(
  '/:id',
  validate(unitIdSchema),
  getUnitById
);

router.post(
  '/',
  roleMiddleware('OWNER', 'STAFF'),
  validate(createUnitSchema),
  createUnit
);

router.patch(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(updateUnitSchema),
  updateUnit
);

router.delete(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(unitIdSchema),
  deleteUnit
);

export default router;