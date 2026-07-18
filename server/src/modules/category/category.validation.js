import { z } from 'zod';

import {
  CATEGORY_STATUS,
  CATEGORY_SORT_FIELDS,
} from './category.constants.js';

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100),

    description: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default(''),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .optional(),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),

    status: z
      .enum(Object.values(CATEGORY_STATUS))
      .optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const categoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),

    limit: z.coerce
      .number()
      .default(10),

    search: z.string().default(''),

    sort: z
      .enum(CATEGORY_SORT_FIELDS)
      .default('createdAt'),

    order: z
      .enum([
        'asc',
        'desc',
      ])
      .default('desc'),
  }),
});