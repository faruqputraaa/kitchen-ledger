import { z } from 'zod';

import { RECIPE_STATUS } from './recipe.constants.js';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/);

const recipeItemSchema = z.object({
  ingredient: objectIdSchema,
  unit: objectIdSchema,
  quantity: z.number().positive(),
});


export const createRecipeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),

    description: z.string().max(500).optional(),

    status: z
      .enum(Object.values(RECIPE_STATUS))
      .optional(),

    note: z.string().max(500).optional(),

    items: z
      .array(recipeItemSchema)
      .min(1, 'Minimal 1 ingredient'),
  }),
});

export const recipeIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateRecipeSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),

  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),

    description: z.string().max(500).optional(),

    status: z
      .enum(Object.values(RECIPE_STATUS))
      .optional(),

    note: z.string().max(500).optional(),

    items: z
      .array(recipeItemSchema)
      .min(1, 'Minimal 1 ingredient')
      .optional(),
  }),
});


export const recipeQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),

    limit: z.coerce.number().default(10),

    search: z.string().optional(),

    sort: z
      .enum(['code', 'name', 'foodCost'])
      .default('createdAt'),

    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});