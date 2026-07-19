import { Router } from 'express';

import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';

import {
  createRecipe,
  getRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} from './recipe.controller.js';

import {
  createRecipeSchema,
  updateRecipeSchema,
  recipeIdSchema,
  recipeQuerySchema,
} from './recipe.validation.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/',
  validate(recipeQuerySchema),
  getRecipes
);

router.get(
  '/:id',
  validate(recipeIdSchema),
  getRecipeById
);

router.post(
  '/',
  roleMiddleware('OWNER', 'STAFF'),
  validate(createRecipeSchema),
  createRecipe
);

router.put(
  '/:id',
  roleMiddleware('OWNER', 'STAFF'),
  validate(updateRecipeSchema),
  updateRecipe
);

router.delete(
  '/:id',
  roleMiddleware('OWNER'),
  validate(recipeIdSchema),
  deleteRecipe
);

export default router;