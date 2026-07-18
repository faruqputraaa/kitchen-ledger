import { Router } from 'express';

import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';
import validate from '#middlewares/validation.middleware';

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from './supplier.controller.js';

import {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdSchema,
  supplierQuerySchema,
} from './supplier.validation.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(supplierQuerySchema),
  getSuppliers
);

router.get(
  '/:id',
  validate(supplierIdSchema),
  getSupplierById
);

router.post(
  '/',
  roleMiddleware('OWNER', 'STAFF'),
  validate(createSupplierSchema),
  createSupplier
);

router.patch(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(updateSupplierSchema),
  updateSupplier
);

router.delete(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(supplierIdSchema),
  deleteSupplier
);

export default router;