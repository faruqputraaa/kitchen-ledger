import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';
import { setRefreshCookie } from '#shared/utils/cookie';

import jwt from 'jsonwebtoken';
import env from '#config/env';

import Tenant from '#modules/tenant/tenant.model';
import tenantService from './tenant.service.js';
import userService from '#modules/user/user.service';
import authService from '#modules/auth/auth.service';

export const listTenants = asyncHandler(async (req, res) => {
  const tenants = await tenantService.listTenants();
  return successResponse(res, { data: tenants });
});

export const verifyInviteCode = asyncHandler(async (req, res) => {
  const data = await tenantService.verifyInviteCode(req.params.code);
  return successResponse(res, { data });
});

export const createTenant = asyncHandler(async (req, res) => {
  if (req.tenantId) {
    return res.status(400).json({ success: false, message: 'Already assigned to a tenant. Leave current tenant first.' });
  }
  const { name, code } = req.validated.body;
  const { tenant, updatedUser } = await tenantService.createTenant(req.user.id, { name, code });
  const result = await authService.googleLogin(updatedUser);
  setRefreshCookie(res, result.refreshToken);
  delete result.refreshToken;
  return successResponse(res, {
    statusCode: 201,
    message: 'Tenant created',
    data: {
      tenant: {
        _id: tenant._id,
        code: tenant.code,
        name: tenant.name,
        inviteCode: tenant.inviteCode,
        inviteCodeExpiresAt: tenant.inviteCodeExpiresAt,
      },
      ...result,
    },
  });
});

export const getTenantDetail = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const data = await tenantService.getTenantDetail(tenantId, req.tenantId, req.user.role);
  return successResponse(res, { data });
});

export const updateTenantSettings = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { name, logo, settings } = req.validated.body;
  const data = await tenantService.updateTenantSettings(tenantId, req.tenantId, { name, logo, settings });
  return successResponse(res, { message: 'Tenant updated', data });
});

export const updateTenantStatus = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { status, plan, limits, trialEndsAt } = req.validated.body;
  const data = await tenantService.updateTenantStatus(tenantId, { status, plan, limits, trialEndsAt });
  return successResponse(res, { message: 'Tenant status updated', data });
});

export const getTenantUsage = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const data = await tenantService.getTenantUsage(tenantId, req.tenantId, req.user.role);
  return successResponse(res, { data });
});

export const generateInviteCode = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const data = await tenantService.generateInviteCode(tenantId, req.tenantId);
  return successResponse(res, {
    message: 'Invite code generated (valid 7 days)',
    data,
  });
});

export const getInviteCode = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const data = await tenantService.getInviteCode(tenantId, req.tenantId);
  return successResponse(res, { data });
});

export const registerWithInvite = asyncHandler(async (req, res) => {
  const { name, email, password, inviteCode } = req.validated.body;

  const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
  if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
  if (tenant.inviteCodeExpiresAt && new Date(tenant.inviteCodeExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
  }
  const userCount = await userService.countByTenant(tenant._id);
  if (userCount >= tenant.limits.maxUsers) {
    return res.status(400).json({ success: false, message: 'Tenant user limit reached' });
  }

  const result = await authService.register({ name, email, password, tenantId: tenant._id });
  setRefreshCookie(res, result.refreshToken);
  delete result.refreshToken;
  const needsInvite = false;
  return successResponse(res, {
    statusCode: 201,
    message: 'Registered successfully',
    data: { ...result, needsInvite },
  });
});

export const loginWithInvite = asyncHandler(async (req, res) => {
  const { email, password, inviteCode } = req.validated.body;

  const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
  if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
  if (tenant.inviteCodeExpiresAt && new Date(tenant.inviteCodeExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
  }

  const result = await authService.login({
    email,
    password,
    tenantId: tenant._id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
  setRefreshCookie(res, result.refreshToken);
  delete result.refreshToken;
  return successResponse(res, { message: 'Login successful', data: result });
});

export const googleInviteComplete = asyncHandler(async (req, res) => {
  const { tempToken, inviteCode } = req.validated.body;
  let googleProfile;
  try {
    googleProfile = jwt.verify(tempToken, env.jwt.accessSecret);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid or expired temporary session' });
  }

  const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
  if (!tenant) return res.status(400).json({ success: false, message: 'Invalid or expired invite code' });
  if (tenant.inviteCodeExpiresAt && new Date(tenant.inviteCodeExpiresAt).getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: 'Invite code kadaluarsa' });
  }
  const userCount = await userService.countByTenant(tenant._id);
  if (userCount >= tenant.limits.maxUsers) {
    return res.status(400).json({ success: false, message: 'Tenant user limit reached' });
  }

  let user = await userService.findByGoogleId(googleProfile.id);
  if (!user) user = await userService.findByEmail(googleProfile.email);
  if (!user) {
    user = await userService.createGoogleUser({
      name: googleProfile.name,
      email: googleProfile.email,
      googleId: googleProfile.id,
      avatar: googleProfile.avatar,
      tenantId: tenant._id,
    });
  }
  const result = await authService.googleLogin(user);
  setRefreshCookie(res, result.refreshToken);
  delete result.refreshToken;
  return successResponse(res, { message: 'Google login complete', data: result });
});

export const completeInvite = asyncHandler(async (req, res) => {
  if (req.tenantId) {
    return res.status(400).json({ success: false, message: 'Already assigned to a tenant' });
  }
  const { inviteCode } = req.validated.body;
  const updatedUser = await tenantService.completeInvite(req.user.id, inviteCode);
  const result = await authService.googleLogin(updatedUser);
  setRefreshCookie(res, result.refreshToken);
  delete result.refreshToken;
  return successResponse(res, {
    message: 'Invitation accepted',
    data: { ...result, needsInvite: false },
  });
});

export const getMembers = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const data = await tenantService.getMembers(tenantId, req.tenantId, req.user.role);
  return successResponse(res, { data });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.params;
  const { role } = req.validated.body;
  const updated = await tenantService.updateMemberRole(tenantId, req.tenantId, userId, role);
  return successResponse(res, { message: 'Role updated', data: updated });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { tenantId, userId } = req.params;
  if (userId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot remove yourself' });
  }
  await tenantService.removeMember(tenantId, req.tenantId, userId);
  return successResponse(res, { message: 'Member removed' });
});

export const exportTenantData = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const data = await tenantService.exportTenantData(tenantId, req.tenantId, req.user.role);
  return successResponse(res, { data });
});
