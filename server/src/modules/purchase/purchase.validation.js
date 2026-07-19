import { z } from 'zod';

import { PURCHASE_STATUS } from './purchase.constants.js';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/);

const purchaseItemSchema = z.object({
  ingredient: objectIdSchema,
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

export const createPurchaseSchema = z.object({
  body: z.object({
    supplier: objectIdSchema.optional().nullable(),

    purchaseDate: z.coerce.date().optional(),

    status: z
      .enum(Object.values(PURCHASE_STATUS))
      .optional(),

    note: z.string().max(500).optional(),

    items: z
      .array(purchaseItemSchema)
      .min(1, 'Minimal 1 item'),
  }),
});

export const purchaseIdSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const purchaseQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),

    limit: z.coerce.number().default(10),

    search: z.string().optional(),

    sort: z
      .enum(['code', 'purchaseDate', 'totalAmount'])
      .default('createdAt'),

    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});