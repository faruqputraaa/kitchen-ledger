import { Router } from 'express';
import jwt from 'jsonwebtoken';
import env from '#config/env';
import validate from '#middlewares/validation.middleware';
import authMiddleware from '#middlewares/auth.middleware';
import roleMiddleware from '#middlewares/role.middleware';
import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';
import { validateTenant } from '#middlewares/tenant.middleware';

import Tenant from '#modules/tenant/tenant.model';
import userService from '#modules/user/user.service';
import authService from '#modules/auth/auth.service';
import { setRefreshCookie } from '#shared/utils/cookie';

import { z } from 'zod';

const router = Router();

// helper
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function isInviteExpired(tenant) {
  if (!tenant.inviteCodeExpiresAt) return false;
  return new Date(tenant.inviteCodeExpiresAt).getTime() < Date.now();
}

// ── SUPER_ADMIN: list all tenants ──
router.get(
  '/',
  authMiddleware,
  roleMiddleware('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const tenants = await Tenant.find().sort({ createdAt: -1 }).select('code name inviteCode plan status limits createdAt trialEndsAt logo');
    const withCounts = await Promise.all(tenants.map(async (t) => {
      const userCount = await userService.countByTenant(t._id);
      return { ...t.toObject(), userCount };
    }));
    return successResponse(res, { data: withCounts });
  }),
);

// ── PUBLIC: verify invite code (show tenant name before join) ──
router.get(
  '/invite/:code',
  asyncHandler(async (req, res) => {
    const { code } = req.params;
    const tenant = await Tenant.findOne({ inviteCode: code.toUpperCase(), status: 'ACTIVE' }).select('code name plan status inviteCodeExpiresAt');
    if (!tenant) return res.status(404).json({ success: false, message: 'Invite code tidak ditemukan' });
    if (isInviteExpired(tenant)) return res.status(400).json({ success: false, message: 'Invite code kadaluarsa, minta kode baru dari owner' });
    return successResponse(res, { data: { code: tenant.code, name: tenant.name, plan: tenant.plan } });
  }),
);

// ── Create Tenant (self-serve) ──
const createTenantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
  }),
});

router.post(
  '/',
  authMiddleware,
  validate(createTenantSchema),
  asyncHandler(async (req, res) => {
    if (req.tenantId) {
      return res.status(400).json({ success: false, message: 'Already assigned to a tenant. Leave current tenant first.' });
    }
    const { name, code } = req.validated.body;
    let tenantCode = code;
    if (!tenantCode) {
      const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'TENANT';
      tenantCode = base;
      let suffix = 0;
      while (await Tenant.findOne({ code: tenantCode })) {
        suffix += 1;
        tenantCode = base.slice(0, 6) + String(suffix).padStart(2, '0');
      }
    } else {
      const exists = await Tenant.findOne({ code: tenantCode });
      if (exists) return res.status(409).json({ success: false, message: 'Tenant code already exists' });
    }
    const inviteCode = generateInviteCode();
    const tenant = await Tenant.create({
      code: tenantCode,
      name,
      inviteCode,
      inviteCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'ACTIVE',
      plan: 'FREE',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    const updatedUser = await userService.updateTenantAndRole(req.user.id, tenant._id, 'OWNER');
    const result = await authService.googleLogin(updatedUser);
    setRefreshCookie(res, result.refreshToken);
    delete result.refreshToken;
    return successResponse(res, { statusCode: 201, message: 'Tenant created', data: { tenant: { _id: tenant._id, code: tenant.code, name: tenant.name, inviteCode: tenant.inviteCode, inviteCodeExpiresAt: tenant.inviteCodeExpiresAt }, ...result } });
  }),
);

// ── Get tenant detail (OWNER or SUPER_ADMIN) ──
router.get(
  '/:tenantId',
  authMiddleware,
  validateTenant,
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    // owner can only view own tenant, super can view any
    if (req.user.role !== 'SUPER_ADMIN' && req.tenantId.toString() !== tenantId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const tenant = await Tenant.findById(tenantId).select('code name domain inviteCode inviteCodeExpiresAt plan status limits settings logo trialEndsAt createdAt');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const userCount = await userService.countByTenant(tenant._id);
    return successResponse(res, { data: { ...tenant.toObject(), userCount } });
  }),
);

// ── OWNER: update tenant settings (name, currency, timezone, logo) ──
const updateTenantSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    logo: z.string().trim().max(500).optional(),
    settings: z.object({
      currency: z.string().trim().min(3).max(10).optional(),
      timezone: z.string().trim().min(3).max(50).optional(),
    }).optional(),
  }),
});

router.patch(
  '/:tenantId',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  validate(updateTenantSchema),
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    const { name, logo, settings } = req.validated.body;
    const update = {};
    if (name) update.name = name;
    if (logo !== undefined) update.logo = logo;
    if (settings?.currency) update['settings.currency'] = settings.currency;
    if (settings?.timezone) update['settings.timezone'] = settings.timezone;
    const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: update }, { new: true }).select('code name logo settings plan status');
    return successResponse(res, { message: 'Tenant updated', data: tenant });
  }),
);

// ── SUPER_ADMIN: update tenant status/plan ──
const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ACTIVE','SUSPENDED','TRIAL']).optional(),
    plan: z.enum(['FREE','PRO','ENTERPRISE']).optional(),
    limits: z.object({
      maxUsers: z.number().int().min(1).max(1000).optional(),
      maxIngredients: z.number().int().min(1).max(100000).optional(),
      maxRecipes: z.number().int().min(1).max(10000).optional(),
    }).optional(),
    trialEndsAt: z.string().optional(),
  }),
});

router.patch(
  '/:tenantId/status',
  authMiddleware,
  roleMiddleware('SUPER_ADMIN'),
  validate(updateStatusSchema),
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    const { status, plan, limits, trialEndsAt } = req.validated.body;
    const update = {};
    if (status) update.status = status;
    if (plan) update.plan = plan;
    if (limits) {
      if (limits.maxUsers !== undefined) update['limits.maxUsers'] = limits.maxUsers;
      if (limits.maxIngredients !== undefined) update['limits.maxIngredients'] = limits.maxIngredients;
      if (limits.maxRecipes !== undefined) update['limits.maxRecipes'] = limits.maxRecipes;
    }
    if (trialEndsAt !== undefined) update.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null;
    const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: update }, { new: true });
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    return successResponse(res, { message: 'Tenant status updated', data: tenant });
  }),
);

// ── OWNER/SUPER: usage stats ──
router.get(
  '/:tenantId/usage',
  authMiddleware,
  validateTenant,
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.user.role !== 'SUPER_ADMIN' && req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    const [userCount, Ingredient, Recipe, Purchase, Menu, Supplier] = await Promise.all([
      userService.countByTenant(tenant._id),
      import('#modules/ingredient/ingredient.model').then(m => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/recipe/recipe.model').then(m => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/purchase/purchase.model').then(m => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/menu/menu.model').then(m => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/supplier/supplier.model').then(m => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
    ]);
    return successResponse(res, { data: {
      tenant: { code: tenant.code, name: tenant.name, plan: tenant.plan, status: tenant.status, limits: tenant.limits },
      usage: { users: userCount, ingredients: Ingredient, recipes: Recipe, purchases: Purchase, menus: Menu, suppliers: Supplier },
      limits: tenant.limits,
    }});
  }),
);

// ── OWNER: generate / rotate invite code (with 7-day expiry) ──
router.post(
  '/:tenantId/invite-code',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized for this tenant' });
    const inviteCode = generateInviteCode();
    const tenant = await Tenant.findByIdAndUpdate(tenantId, { inviteCode, inviteCodeExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }, { new: true }).select('code name inviteCode inviteCodeExpiresAt');
    return successResponse(res, { message: 'Invite code generated (valid 7 days)', data: { inviteCode: tenant.inviteCode, expiresAt: tenant.inviteCodeExpiresAt, tenant: { code: tenant.code, name: tenant.name } } });
  }),
);

// ── OWNER: get current invite code ──
router.get(
  '/:tenantId/invite-code',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized for this tenant' });
    const tenant = await Tenant.findById(tenantId).select('code name inviteCode inviteCodeExpiresAt');
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    return successResponse(res, { data: { inviteCode: tenant.inviteCode, expiresAt: tenant.inviteCodeExpiresAt, expired: isInviteExpired(tenant) } });
  }),
);

// ── PUBLIC: register with invite code ──
const registerWithInviteSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().transform((v) => v.toLowerCase()),
    password: z.string().min(6).max(100),
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});

router.post(
  '/register/invite',
  validate(registerWithInviteSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, inviteCode } = req.validated.body;
    const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
    if (isInviteExpired(tenant)) return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
    const userCount = await userService.countByTenant(tenant._id);
    if (userCount >= tenant.limits.maxUsers) return res.status(400).json({ success: false, message: 'Tenant user limit reached' });
    const result = await authService.register({ name, email, password, tenantId: tenant._id });
    setRefreshCookie(res, result.refreshToken);
    delete result.refreshToken;
    return successResponse(res, { statusCode: 201, message: 'Registered successfully', data: result });
  }),
);

// ── PUBLIC: login with invite code ──
const loginWithInviteSchema = z.object({
  body: z.object({
    email: z.email().transform((v) => v.toLowerCase()),
    password: z.string().min(1),
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});

router.post(
  '/login/invite',
  validate(loginWithInviteSchema),
  asyncHandler(async (req, res) => {
    const { email, password, inviteCode } = req.validated.body;
    const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
    if (isInviteExpired(tenant)) return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
    const result = await authService.login({ email, password, tenantId: tenant._id, ipAddress: req.ip, userAgent: req.get('user-agent') });
    setRefreshCookie(res, result.refreshToken);
    delete result.refreshToken;
    return successResponse(res, { message: 'Login successful', data: result });
  }),
);

// ── PUBLIC: Google Onboarding complete ──
const googleInviteCompleteSchema = z.object({
  body: z.object({
    tempToken: z.string().min(1),
    inviteCode: z.string().trim().min(4).max(20).toUpperCase(),
  }),
});

router.post(
  '/google/invite/complete',
  validate(googleInviteCompleteSchema),
  asyncHandler(async (req, res) => {
    const { tempToken, inviteCode } = req.validated.body;
    let googleProfile;
    try { googleProfile = jwt.verify(tempToken, env.jwt.accessSecret); } catch { return res.status(400).json({ success: false, message: 'Invalid or expired temporary session' }); }
    const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
    if (isInviteExpired(tenant)) return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
    const userCount = await userService.countByTenant(tenant._id);
    if (userCount >= tenant.limits.maxUsers) return res.status(400).json({ success: false, message: 'Tenant user limit reached' });
    let user = await userService.findByGoogleId(googleProfile.id);
    if (!user) user = await userService.findByEmail(googleProfile.email);
    if (!user) {
      user = await userService.createGoogleUser({ name: googleProfile.name, email: googleProfile.email, googleId: googleProfile.id, avatar: googleProfile.avatar, tenantId: tenant._id });
    }
    const result = await authService.googleLogin(user);
    setRefreshCookie(res, result.refreshToken);
    delete result.refreshToken;
    return successResponse(res, { message: 'Google login complete', data: result });
  }),
);

// ── AUTH: complete invitation ──
const completeInviteSchema = z.object({
  body: z.object({ inviteCode: z.string().trim().min(4).max(20).toUpperCase() }),
});

router.post(
  '/complete-invite',
  authMiddleware,
  validateTenant,
  validate(completeInviteSchema),
  asyncHandler(async (req, res) => {
    if (req.tenantId) return res.status(400).json({ success: false, message: 'Already assigned to a tenant' });
    const { inviteCode } = req.validated.body;
    const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
    if (isInviteExpired(tenant)) return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
    const updatedUser = await userService.completeInvite(req.user.id, inviteCode);
    const result = await authService.googleLogin(updatedUser);
    setRefreshCookie(res, result.refreshToken);
    delete result.refreshToken;
    return successResponse(res, { message: 'Invitation accepted', data: result });
  }),
);

// ── Members: list / update role / kick ──
router.get(
  '/:tenantId/members',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    const members = await userService.findByTenant(tenantId);
    return successResponse(res, { data: members });
  }),
);

router.patch(
  '/:tenantId/members/:userId/role',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(async (req, res) => {
    const { tenantId, userId } = req.params;
    const { role } = req.body;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!['OWNER','ADMIN','STAFF'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid role' });
    const updated = await userService.updateTenantAndRole(userId, tenantId, role);
    return successResponse(res, { message: 'Role updated', data: updated });
  }),
);

router.delete(
  '/:tenantId/members/:userId',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(async (req, res) => {
    const { tenantId, userId } = req.params;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (userId === req.user.id) return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
    await userService.removeFromTenant(userId);
    return successResponse(res, { message: 'Member removed' });
  }),
);

// ── Export tenant data (OWNER) ──
router.get(
  '/:tenantId/export',
  authMiddleware,
  validateTenant,
  roleMiddleware('OWNER'),
  asyncHandler(async (req, res) => {
    const { tenantId } = req.params;
    if (req.tenantId.toString() !== tenantId) return res.status(403).json({ success: false, message: 'Not authorized' });
    const tenant = await Tenant.findById(tenantId);
    const [users, Ingredient, Recipe, Purchase] = await Promise.all([
      userService.findByTenant(tenantId),
      import('#modules/ingredient/ingredient.model').then(m => m.default.find({ tenantId, isDeleted: false }).lean()),
      import('#modules/recipe/recipe.model').then(m => m.default.find({ tenantId, isDeleted: false }).lean()),
      import('#modules/purchase/purchase.model').then(m => m.default.find({ tenantId, isDeleted: false }).lean()),
    ]);
    return successResponse(res, { data: { tenant: { code: tenant.code, name: tenant.name }, exportedAt: new Date().toISOString(), users: users.map(u => ({ code: u.code, name: u.name, email: u.email, role: u.role })), ingredients: Ingredient, recipes: Recipe, purchases: Purchase } });
  }),
);

export default router;
