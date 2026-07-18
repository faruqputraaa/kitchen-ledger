import logger from '#config/logger';
import { errorResponse } from '#response/apiResponse';

const errorMiddleware = (error, req, res, next) => {
  logger.error(error.stack);

  return errorResponse(res, {
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal Server Error',
    errors: error.errors || null,
  });
};

export default errorMiddleware;