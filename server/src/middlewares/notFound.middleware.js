import { errorResponse } from '../shared/response/apiResponse.js';

const notFoundMiddleware = (req, res) => {
  return errorResponse(res, {
    statusCode: 404,
    message: `Route ${req.originalUrl} not found`,
  });
};

export default notFoundMiddleware;
