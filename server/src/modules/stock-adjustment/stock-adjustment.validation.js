import z from 'zod';

export const createStockAdjustmentSchema = z.object({
  body: z.object({
    ingredient: z.string().min(1, 'Ingredient is required'),
    reason: z.enum(['WASTE', 'TRANSFER', 'CORRECTION', 'OTHER']),
    quantity: z.number().min(0.01, 'Quantity must be > 0'),
    adjustmentDate: z.string().optional(),
    notes: z.string().max(500).optional().default(''),
  }),
});

export const stockAdjustmentIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});

export const stockAdjustmentQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    limit: z.coerce.number().min(1).max(100).optional().default(20),
    sort: z.string().optional().default('adjustmentDate'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
    ingredient: z.string().optional(),
  }),
});