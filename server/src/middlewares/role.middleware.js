import ForbiddenError from '#errors/ForbiddenError';

const roleMiddleware =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('Permission denied')
      );
    }

    next();
  };

export default roleMiddleware;