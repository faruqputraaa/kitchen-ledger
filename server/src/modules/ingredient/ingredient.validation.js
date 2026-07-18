import { z } from 'zod';

import { INGREDIENT_STATUS } from './ingredient.constants.js';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const createIngredientSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    category: z.string(),
    unit: z.string(),
    minimumStock: z.number().optional(),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const updateIngredientSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    unit: z.string().optional(),
    minimumStock: z.number().optional(),
    notes: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  }),
});

export const ingredientIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const ingredientQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    search: z.string().optional(),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('asc'),
  }),
});
