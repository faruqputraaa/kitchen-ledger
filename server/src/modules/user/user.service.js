import bcrypt from 'bcrypt';

import ConflictError from '#errors/ConflictError';
import counterService from '#shared/counter/counter.service';
import userRepository from './user.repository.js';
import Tenant from '#modules/tenant/tenant.model';
import { AUTH_PROVIDER } from './user.constants.js';

class UserService {
  async createLocalUser(payload) {
    const existingUser = await userRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(payload.password, 12);
    const code = await counterService.generate('user');

    return userRepository.create({
      code,
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      provider: AUTH_PROVIDER.LOCAL,
      tenantId: payload.tenantId,
    });
  }

  async createGoogleUser(payload) {
    const code = await counterService.generate('user');

    return userRepository.create({
      code,
      name: payload.name,
      email: payload.email,
      googleId: payload.googleId,
      avatar: payload.avatar,
      provider: AUTH_PROVIDER.GOOGLE,
      tenantId: payload.tenantId,
    });
  }

  async findOrCreateGoogleUserWithInvite(payload) {
    const tenant = await Tenant.findOne({ inviteCode: payload.inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) {
      throw new Error('Invalid or expired invite code');
    }

    const userCount = await userRepository.countByTenant(tenant._id);
    if (userCount >= tenant.limits.maxUsers) {
      throw new Error('Tenant user limit reached');
    }

    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new ConflictError('Email already exists');
    }

    return this.createGoogleUser({
      name: payload.name,
      email: payload.email,
      googleId: payload.googleId,
      avatar: payload.avatar,
      tenantId: tenant._id,
    });
  }

  async createOwner(payload) {
    return userRepository.create({
      code: payload.code,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      provider: AUTH_PROVIDER.LOCAL,
      tenantId: payload.tenantId,
    });
  }

  async findByGoogleId(googleId) {
    return userRepository.findByGoogleId(googleId);
  }

  async findByEmail(email) {
    return userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email, tenantId) {
    return userRepository.findByEmailWithPassword(email, tenantId);
  }

  async findById(id) {
    return userRepository.findById(id);
  }

  async updateLastLogin(id) {
    return userRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  async findCurrentUser(id) {
    return userRepository.findById(id);
  }

  async countByTenant(tenantId) {
    return userRepository.countByTenant(tenantId);
  }

  async updateTenantAndRole(userId, tenantId, role) {
    return userRepository.updateTenantAndRole(userId, tenantId, role);
  }

  async updateTenant(userId, tenantId) {
    return userRepository.updateTenant(userId, tenantId);
  }


  async findByTenant(tenantId) {
    return userRepository.findByTenant(tenantId);
  }

  async removeFromTenant(userId) {
    return userRepository.updateTenant(userId, null);
  }

  async completeInvite(userId, inviteCode) {
    const tenant = await Tenant.findOne({ inviteCode: inviteCode.toUpperCase(), status: 'ACTIVE' });
    if (!tenant) throw new Error('Invalid or expired invite code');
    if (tenant.inviteCodeExpiresAt && new Date(tenant.inviteCodeExpiresAt).getTime() < Date.now()) throw new Error('Invite code kadaluarsa');
    const count = await userRepository.countByTenant(tenant._id);
    if (count >= tenant.limits.maxUsers) throw new Error('Tenant user limit reached');
    return userRepository.updateTenant(userId, tenant._id);
  }
}

export default new UserService();
