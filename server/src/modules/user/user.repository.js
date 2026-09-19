import User from './user.model.js';

class UserRepository {
  create(payload) {
    return User.create(payload);
  }

  findById(id) {
    return User.findById(id).select('-password');
  }

  findByCode(code) {
    return User.findOne({ code });
  }

  findByEmail(email) {
    return User.findOne({ email });
  }

  findByEmailWithPassword(email, tenantId) {
    const query = { email };
    if (tenantId) {
      query.tenantId = tenantId;
    }
    return User.findOne(query);
  }

  findByGoogleId(googleId) {
    return User.findOne({ googleId });
  }

  update(id, payload) {
    return User.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  }

  updateTenantAndRole(id, tenantId, role) {
    const update = { tenantId };
    if (role) update.role = role;
    return User.findByIdAndUpdate(id, update, { new: true });
  }

  updateTenant(id, tenantId) {
    return User.findByIdAndUpdate(id, { tenantId }, { new: true });
  }

  findByTenant(tenantId) {
    return User.find({ tenantId }).select('-password').lean();
  }

  countByTenant(tenantId) {
    return User.countDocuments({ tenantId });
  }

  delete(id) {
    return User.findByIdAndDelete(id);
  }
}

export default new UserRepository();
