import { Router } from 'express';
import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';
import { requireTenant, validateTenant } from '#middlewares/tenant.middleware';
import asyncHandler from '#shared/utils/asyncHandler';

import * as tenantController from './tenant.controller.js';
import {
  createTenantSchema,
  updateTenantSchema,
  updateTenantStatusSchema,
  registerWithInviteSchema,
  loginWithInviteSchema,
  googleInviteCompleteSchema,
  completeInviteSchema,
  memberRoleSchema,
} from './tenant.validation.js';

const router = Router();

// ── SUPER_ADMIN: list all tenants ──
router.get(
  '/',
  authMiddleware,
  roleMiddleware('SUPER_ADMIN'),
  asyncHandler(tenantController.listTenants),
);

// ── PUBLIC: verify invite code (show tenant name before join) ──
router.get(
  '/invite/:code',
  asyncHandler(tenantController.verifyInviteCode),
);

// ── Create Tenant (self-serve) ──
router.post(
  '/',
  authMiddleware,
  validate(createTenantSchema),
  asyncHandler(tenantController.createTenant),
);

// ── Get tenant detail (OWNER own or SUPER_ADMIN any) ──
router.get(
  '/:tenantId',
  authMiddleware,
  requireTenant,
  validateTenant,
  asyncHandler(tenantController.getTenantDetail),
);

// ── OWNER: update tenant settings (name, currency, timezone, logo) ──
router.patch(
  '/:tenantId',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER'),
  validate(updateTenantSchema),
  asyncHandler(tenantController.updateTenantSettings),
);

// ── SUPER_ADMIN: update tenant status/plan/limits ──
router.patch(
  '/:tenantId/status',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('SUPER_ADMIN'),
  validate(updateTenantStatusSchema),
  asyncHandler(tenantController.updateTenantStatus),
);

// ── OWNER/SUPER: usage stats ──
router.get(
  '/:tenantId/usage',
  authMiddleware,
  requireTenant,
  validateTenant,
  asyncHandler(tenantController.getTenantUsage),
);

// ── OWNER: generate / rotate invite code (7-day expiry) ──
router.post(
  '/:tenantId/invite-code',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(tenantController.generateInviteCode),
);

// ── OWNER: get current invite code ──
router.get(
  '/:tenantId/invite-code',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(tenantController.getInviteCode),
);

// ── PUBLIC: register with invite code ──
router.post(
  '/register/invite',
  validate(registerWithInviteSchema),
  asyncHandler(tenantController.registerWithInvite),
);

// ── PUBLIC: login with invite code ──
router.post(
  '/login/invite',
  validate(loginWithInviteSchema),
  asyncHandler(tenantController.loginWithInvite),
);

// ── PUBLIC: Google Onboarding complete ──
router.post(
  '/google/invite/complete',
  validate(googleInviteCompleteSchema),
  asyncHandler(tenantController.googleInviteComplete),
);

// ── AUTH: complete invitation (authenticated) ──
router.post(
  '/complete-invite',
  authMiddleware,
  validateTenant,
  validate(completeInviteSchema),
  asyncHandler(tenantController.completeInvite),
);

// ── Members: list (OWNER/ADMIN/STAFF can read; field filtering) ──
router.get(
  '/:tenantId/members',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER', 'ADMIN', 'STAFF'),
  asyncHandler(tenantController.getMembers),
);

// ── Members: update role (OWNER only) ──
router.patch(
  '/:tenantId/members/:userId/role',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER'),
  validate(memberRoleSchema),
  asyncHandler(tenantController.updateMemberRole),
);

// ── Members: remove/kick (OWNER only) ──
router.delete(
  '/:tenantId/members/:userId',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(tenantController.removeMember),
);

// ── Export tenant data (OWNER or SUPER_ADMIN) ──
router.get(
  '/:tenantId/export',
  authMiddleware,
  requireTenant,
  validateTenant,
  roleMiddleware('OWNER', 'SUPER_ADMIN'),
  asyncHandler(tenantController.exportTenantData),
);

export default router;
