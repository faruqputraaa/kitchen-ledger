import { Router } from 'express';

import * as ingredientController from './ingredient.controller.js';

import validate from '#middlewares/validation.middleware';

import authMiddleware from '#middlewares/auth.middleware';

import roleMiddleware from '#middlewares/role.middleware';

import {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdSchema,
  ingredientQuerySchema,
} from './ingredient.validation.js';


const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(ingredientQuerySchema),
  ingredientController.getIngredients
);

router.get(
  '/:id',
  validate(ingredientIdSchema),
  ingredientController.getIngredientById
);

router.post(
  '/',
  roleMiddleware('OWNER', 'STAFF'),
  validate(createIngredientSchema),
  ingredientController.createIngredient
);

router.patch(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(updateIngredientSchema),
  ingredientController.updateIngredient
);

router.delete(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(ingredientIdSchema),
  ingredientController.deleteIngredient
);

export default router;