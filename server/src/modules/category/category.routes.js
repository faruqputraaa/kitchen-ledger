import { Router } from 'express';

import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';
import validate from '#middlewares/validation.middleware';

import { create, findAll, findById, update, remove } from './category.controller.js';

import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoryQuerySchema,
} from './category.validation.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate(categoryQuerySchema), findAll);

router.get('/:id', validate(categoryIdSchema), findById);

router.post('/', roleMiddleware('OWNER', 'STAFF'), validate(createCategorySchema), create);

router.patch('/:id', roleMiddleware('OWNER', 'STAFF'), validate(updateCategorySchema), update);

router.delete('/:id', roleMiddleware('OWNER', 'STAFF'), validate(categoryIdSchema), remove);

export default router;
