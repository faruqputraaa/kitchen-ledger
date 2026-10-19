import Tenant from '#modules/tenant/tenant.model';
import ConflictError from '#errors/ConflictError';
import NotFoundError from '#errors/NotFoundError';
import ForbiddenError from '#errors/ForbiddenError';
import BadRequestError from '#errors/BadRequestError';

import userService from '#modules/user/user.service';

const INVITE_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

function assertOwnTenant(userTenantId, tenantId) {
  if (userTenantId.toString() !== tenantId) {
    throw new ForbiddenError('Not authorized for this tenant');
  }
}

class TenantService {
  async listTenants() {
    const tenants = await Tenant.find()
      .sort({ createdAt: -1 })
      .select('code name inviteCode plan status limits createdAt trialEndsAt logo');
    const withCounts = await Promise.all(
      tenants.map(async (t) => {
        const userCount = await userService.countByTenant(t._id);
        return { ...t.toObject(), userCount };
      })
    );
    return withCounts;
  }

  async createTenant(userId, { name, code }) {
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
      if (exists) throw new ConflictError('Tenant code already exists');
    }

    const inviteCode = generateInviteCode();
    const tenant = await Tenant.create({
      code: tenantCode,
      name,
      inviteCode,
      inviteCodeExpiresAt: new Date(Date.now() + INVITE_CODE_TTL_MS),
      status: 'ACTIVE',
      plan: 'FREE',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
    const updatedUser = await userService.updateTenantAndRole(userId, tenant._id, 'OWNER');
    return { tenant, updatedUser };
  }

  async getTenantDetail(tenantId, userTenantId, role) {
    if (role !== 'SUPER_ADMIN' && userTenantId.toString() !== tenantId) {
      throw new ForbiddenError('Not authorized to view this tenant');
    }
    const tenant = await Tenant.findById(tenantId).select(
      'code name domain inviteCode inviteCodeExpiresAt plan status limits settings logo trialEndsAt createdAt'
    );
    if (!tenant) throw new NotFoundError('Tenant not found');
    const userCount = await userService.countByTenant(tenant._id);
    return { ...tenant.toObject(), userCount };
  }

  async updateTenantSettings(tenantId, userTenantId, { name, logo, settings }) {
    assertOwnTenant(userTenantId, tenantId);
    const update = {};
    if (name) update.name = name;
    if (logo !== undefined) update.logo = logo;
    if (settings?.currency) update['settings.currency'] = settings.currency;
    if (settings?.timezone) update['settings.timezone'] = settings.timezone;
    const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: update }, { new: true }).select(
      'code name logo settings plan status'
    );
    if (!tenant) throw new NotFoundError('Tenant not found');
    return tenant;
  }

  async updateTenantStatus(tenantId, { status, plan, limits, trialEndsAt }) {
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
    if (!tenant) throw new NotFoundError('Tenant not found');
    return tenant;
  }

  async getTenantUsage(tenantId, userTenantId, role) {
    if (role !== 'SUPER_ADMIN' && userTenantId.toString() !== tenantId) {
      throw new ForbiddenError('Not authorized to view usage for this tenant');
    }
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant not found');
    const [userCount, Ingredient, Recipe, Purchase, Menu, Supplier] = await Promise.all([
      userService.countByTenant(tenant._id),
      import('#modules/ingredient/ingredient.model').then((m) => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/recipe/recipe.model').then((m) => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/purchase/purchase.model').then((m) => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/menu/menu.model').then((m) => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
      import('#modules/supplier/supplier.model').then((m) => m.default.countDocuments({ tenantId: tenant._id, isDeleted: false })),
    ]);
    return {
      tenant: { code: tenant.code, name: tenant.name, plan: tenant.plan, status: tenant.status, limits: tenant.limits },
      usage: { users: userCount, ingredients: Ingredient, recipes: Recipe, purchases: Purchase, menus: Menu, suppliers: Supplier },
      limits: tenant.limits,
    };
  }

  async exportTenantData(tenantId, userTenantId, role) {
    if (role !== 'SUPER_ADMIN') {
      assertOwnTenant(userTenantId, tenantId);
    }
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant not found');
    const [users, Ingredient, Recipe, Purchase] = await Promise.all([
      userService.findByTenant(tenantId),
      import('#modules/ingredient/ingredient.model').then((m) => m.default.find({ tenantId, isDeleted: false }).lean()),
      import('#modules/recipe/recipe.model').then((m) => m.default.find({ tenantId, isDeleted: false }).lean()),
      import('#modules/purchase/purchase.model').then((m) => m.default.find({ tenantId, isDeleted: false }).lean()),
    ]);
    return {
      tenant: { code: tenant.code, name: tenant.name },
      exportedAt: new Date().toISOString(),
      users: users.map((u) => ({ code: u.code, name: u.name, email: u.email, role: u.role })),
      ingredients: Ingredient,
      recipes: Recipe,
      purchases: Purchase,
    };
  }

  async generateInviteCode(tenantId, userTenantId) {
    assertOwnTenant(userTenantId, tenantId);
    const inviteCode = generateInviteCode();
    const tenant = await Tenant.findByIdAndUpdate(
      tenantId,
      { inviteCode, inviteCodeExpiresAt: new Date(Date.now() + INVITE_CODE_TTL_MS) },
      { new: true }
    ).select('code name inviteCode inviteCodeExpiresAt');
    if (!tenant) throw new NotFoundError('Tenant not found');
    return {
      inviteCode: tenant.inviteCode,
      expiresAt: tenant.inviteCodeExpiresAt,
      tenant: { code: tenant.code, name: tenant.name },
    };
  }

  async getInviteCode(tenantId, userTenantId) {
    assertOwnTenant(userTenantId, tenantId);
    const tenant = await Tenant.findById(tenantId).select('code name inviteCode inviteCodeExpiresAt');
    if (!tenant) throw new NotFoundError('Tenant not found');
    return {
      inviteCode: tenant.inviteCode,
      expiresAt: tenant.inviteCodeExpiresAt,
      expired: isInviteExpired(tenant),
    };
  }

  async verifyInviteCode(code) {
    const tenant = await Tenant.findOne({ inviteCode: code.toUpperCase(), status: 'ACTIVE' }).select(
      'code name plan status inviteCodeExpiresAt'
    );
    if (!tenant) throw new NotFoundError('Invite code tidak ditemukan');
    if (isInviteExpired(tenant)) throw new BadRequestError('Invite code kadaluarsa, minta kode baru dari owner');
    return { code: tenant.code, name: tenant.name, plan: tenant.plan };
  }

  async completeInvite(userId, inviteCode) {
    const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) throw new BadRequestError('Invalid or expired invite code');
    if (isInviteExpired(tenant)) throw new BadRequestError('Invite code kadaluarsa');
    const count = await userService.countByTenant(tenant._id);
    if (count >= tenant.limits.maxUsers) throw new BadRequestError('Tenant user limit reached');
    return userService.completeInvite(userId, inviteCode);
  }

  async getMembers(tenantId, userTenantId, requestingRole) {
    assertOwnTenant(userTenantId, tenantId);
    const members = await userService.findByTenant(tenantId);
    const tenant = await Tenant.findById(tenantId).select('inviteCode');
    return members.map((m) => {
      const base = {
        _id: m._id,
        code: m.code,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        avatar: m.avatar,
        createdAt: m.createdAt,
      };
      if (requestingRole === 'OWNER') {
        return { ...base, tenantId: m.tenantId, lastLogin: m.lastLogin, inviteCode: tenant?.inviteCode ?? null };
      }
      return base;
    });
  }

  async updateMemberRole(tenantId, userTenantId, targetUserId, role) {
    assertOwnTenant(userTenantId, tenantId);
    if (!['OWNER', 'ADMIN', 'STAFF'].includes(role)) {
      throw new BadRequestError('Invalid role');
    }
    const updated = await userService.updateTenantAndRole(targetUserId, tenantId, role);
    return updated;
  }

  async removeMember(tenantId, userTenantId, targetUserId) {
    assertOwnTenant(userTenantId, tenantId);
    await userService.removeFromTenant(targetUserId);
  }
}

export default new TenantService();
