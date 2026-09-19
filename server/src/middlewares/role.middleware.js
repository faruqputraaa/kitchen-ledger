import ForbiddenError from '#errors/ForbiddenError';

const roleMiddleware =
  (...roles) =>
  (req, res, next) => {
    if (req.user.role === 'SUPER_ADMIN') return next();
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Permission denied'));
    }

    next();
  };

export default roleMiddleware;
