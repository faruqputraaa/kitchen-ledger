import NotFoundError from '#errors/NotFoundError';
import Tenant from '#modules/tenant/tenant.model';

export const validateTenant = async (req, res, next) => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId || null;
    if (!tenantId) {
      req.tenant = null;
      return next();
    }
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) throw new NotFoundError('Tenant not found');
    if (tenant.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Tenant is not active' });
    }
    req.tenant = tenant;
    req.tenantId = tenant._id;
    // set mongoose options for tenantScope
    req.mongooseOptions = { ...req.mongooseOptions, tenantId: tenant._id };
    next();
  } catch (error) {
    next(error);
  }
};

export const requireTenant = async (req, res, next) => {
  try {
    let tenantId = req.tenantId || req.user?.tenantId || null;
    if (!tenantId) {
      return res.status(403).json({ success: false, message: 'Tenant not assigned. Please enter invitation code.', needsInvite: true });
    }
    // Load tenant if not yet loaded
    if (!req.tenant) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) throw new NotFoundError('Tenant not found');
      if (tenant.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'Tenant is not active' });
      }
      req.tenant = tenant;
      req.tenantId = tenant._id;
    }
    req.mongooseOptions = { ...req.mongooseOptions, tenantId: req.tenantId };
    // Inject into body/query for create/read helpers
    if (req.method === 'POST' && req.body && !req.body.tenantId) req.body.tenantId = req.tenantId;
    if (req.method === 'GET' && req.query && !req.query.tenantId) req.query.tenantId = req.tenantId.toString();
    next();
  } catch (error) {
    next(error);
  }
};
