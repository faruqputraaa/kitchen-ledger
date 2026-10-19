export const tenantScope = (req, res, next) => {
  if (!req.tenantId) {
    return next();
  }

  // Store tenantId for mongoose query options
  req.mongooseOptions = {
    ...req.mongooseOptions,
    tenantId: req.tenantId,
  };

  next();
};

export const injectTenantId = (req, res, next) => {
  if (!req.tenantId) {
    return next();
  }

  // Inject tenantId into request body for create operations
  if (req.method === 'POST' && req.body) {
    req.body.tenantId = req.tenantId;
  }

  // Inject tenantId into query params for read operations
  if (req.method === 'GET' && req.query) {
    req.query.tenantId = req.tenantId;
  }

  next();
};