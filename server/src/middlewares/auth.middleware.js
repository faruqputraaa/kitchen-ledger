import UnauthorizedError from '#errors/UnauthorizedError';
import { verifyAccessToken } from '#config/jwt';

const authMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return next(new UnauthorizedError('Access token is required'));
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new UnauthorizedError('Invalid authorization header'));
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;

    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
};

export default authMiddleware;
