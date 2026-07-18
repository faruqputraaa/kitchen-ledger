import asyncHandler from '../../shared/utils/asyncHandler.js';
import { successResponse } from '../../shared/response/apiResponse.js';

const startedAt = Date.now();

export const healthCheck = asyncHandler(async (req, res) => {
  return successResponse(res, {
    message: 'Smart Kitchen API is running',

    data: {
      uptime: Math.floor((Date.now() - startedAt) / 1000),

      timestamp: new Date(),

      environment: process.env.NODE_ENV,

      version: 'v1',
    },
  });
});
