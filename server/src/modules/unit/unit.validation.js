import { z } from 'zod';

import { UNIT_STATUS, UNIT_SORT_FIELDS } from './unit.constants.js';

export const createUnitSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),

    symbol: z.string().trim().min(1).max(20),

    description: z.string().trim().max(500).optional().default(''),
  }),
});

export const updateUnitSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),

    symbol: z.string().trim().min(1).max(20).optional(),

    description: z.string().trim().max(500).optional(),

    status: z.enum(Object.values(UNIT_STATUS)).optional(),
  }),
});

export const unitIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const unitQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),

    limit: z.coerce.number().default(10),

    search: z.string().default(''),

    sort: z.enum(UNIT_SORT_FIELDS).default('createdAt'),

    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});
