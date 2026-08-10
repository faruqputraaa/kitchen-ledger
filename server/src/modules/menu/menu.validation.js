import { z } from 'zod';

import { MENU_STATUS } from './menu.constants.js';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/);

export const createMenuSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    description: z.string().max(500).optional(),
    recipe: objectIdSchema,
    sellingPrice: z.number().positive(),
    status: z
      .enum(Object.values(MENU_STATUS))
      .optional(),
  }),
});

export const menuIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const updateMenuSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    sellingPrice: z.number().positive().optional(),
    status: z
      .enum(Object.values(MENU_STATUS))
      .optional(),
  }),
});

export const menuQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(10),
    search: z.string().optional(),
    status: z.string().optional(),
    recipe: objectIdSchema.optional(),
    sort: z
      .enum(['code', 'name', 'sellingPrice', 'foodCost', 'margin', 'createdAt'])
      .default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});