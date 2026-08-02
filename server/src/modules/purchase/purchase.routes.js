import { Router } from 'express';

import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';

import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  deletePurchase,
} from './purchase.controller.js';

import {
  createPurchaseSchema,
  purchaseIdSchema,
  purchaseQuerySchema,
} from './purchase.validation.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(purchaseQuerySchema),
  getPurchases
);

router.get(
  '/:id',
  validate(purchaseIdSchema),
  getPurchaseById
);

router.post(
  '/',
  roleMiddleware('OWNER', 'STAFF'),
  validate(createPurchaseSchema),
  createPurchase
);

router.delete(
  '/:id',
  roleMiddleware('OWNER'),
  validate(purchaseIdSchema),
  deletePurchase
);

export default router;
