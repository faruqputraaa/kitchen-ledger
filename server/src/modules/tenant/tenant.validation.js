import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const tenantIdSchema = z.object({
  params: z.object({
    tenantId: objectIdSchema,
  }),
});

export const createTenantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
  }),
});

export const updateTenantSchema = z.object({
  params: z.object({
    tenantId: objectIdSchema,
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    logo: z.string().trim().max(500).optional(),
    settings: z
      .object({
        currency: z.string().trim().min(3).max(10).optional(),
        timezone: z.string().trim().min(3).max(50).optional(),
      })
      .optional(),
  }),
});

export const updateTenantStatusSchema = z.object({
  params: z.object({
    tenantId: objectIdSchema,
  }),
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL']).optional(),
    plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
    limits: z
      .object({
        maxUsers: z.number().int().min(1).max(1000).optional(),
        maxIngredients: z.number().int().min(1).max(100000).optional(),
        maxRecipes: z.number().int().min(1).max(10000).optional(),
      })
      .optional(),
    trialEndsAt: z.string().optional(),
  }),
});

export const completeInviteSchema = z.object({
  body: z.object({
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});

export const memberRoleSchema = z.object({
  params: z.object({
    tenantId: objectIdSchema,
    userId: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(['OWNER', 'ADMIN', 'STAFF']),
  }),
});

export const registerWithInviteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().transform((v) => v.toLowerCase()),
    password: z.string().min(6).max(100),
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});

export const loginWithInviteSchema = z.object({
  body: z.object({
    email: z.email().transform((v) => v.toLowerCase()),
    password: z.string().min(1),
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});

export const googleInviteCompleteSchema = z.object({
  body: z.object({
    tempToken: z.string().min(1),
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});
