import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';

import purchaseMapper from './purchase.mapper.js';
import purchaseService from './purchase.service.js';

export const createPurchase = asyncHandler(
  async (req, res) => {
    const purchase = await purchaseService.create(
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      statusCode: 201,
      message: 'Purchase created successfully',
      data: purchaseMapper.toDetail(purchase),
    });
  }
);

export const getPurchases = asyncHandler(
  async (req, res) => {
    const result = await purchaseService.findAll(
      req.validated.query
    );

    return successResponse(res, {
      data: purchaseMapper.toList(result.data),
      pagination: result.pagination,
    });
  }
);

export const getPurchaseById = asyncHandler(
  async (req, res) => {
    const purchase = await purchaseService.findById(
      req.validated.params.id
    );

    return successResponse(res, {
      data: purchaseMapper.toDetail(purchase),
    });
  }
);

export const deletePurchase = asyncHandler(
  async (req, res) => {
    await purchaseService.delete(
      req.validated.params.id,
      req.user.id
    );

    return successResponse(res, {
      message: 'Purchase deleted successfully',
    });
  }
);
