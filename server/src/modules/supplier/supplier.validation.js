import { z } from 'zod';

import {
  SUPPLIER_STATUS,
  SUPPLIER_SORT_FIELDS,
} from './supplier.constants.js';

export const createSupplierSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(150),

    contactPerson: z
      .string()
      .trim()
      .max(100)
      .optional()
      .default(''),

    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .default(''),

    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .optional()
      .or(z.literal(''))
      .default(''),

    address: z
      .string()
      .trim()
      .max(500)
      .optional()
      .default(''),

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional()
      .default(''),
  }),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),

  body: z.object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .optional(),

    contactPerson: z
      .string()
      .trim()
      .max(100)
      .optional(),

    phone: z
      .string()
      .trim()
      .max(30)
      .optional(),

    email: z
      .string()
      .trim()
      .email()
      .max(255)
      .optional()
      .or(z.literal('')),

    address: z
      .string()
      .trim()
      .max(500)
      .optional(),

    notes: z
      .string()
      .trim()
      .max(1000)
      .optional(),

    status: z
      .enum(Object.values(SUPPLIER_STATUS))
      .optional(),
  }),
});

export const supplierIdSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const supplierQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),

    limit: z.coerce.number().default(10),

    search: z.string().default(''),

    sort: z
      .enum(SUPPLIER_SORT_FIELDS)
      .default('createdAt'),

    order: z
      .enum(['asc', 'desc'])
      .default('desc'),
  }),
});