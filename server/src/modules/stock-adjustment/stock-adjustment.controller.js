import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';
import stockAdjustmentMapper from './stock-adjustment.mapper.js';
import stockAdjustmentService from './stock-adjustment.service.js';

export const createAdjustment = asyncHandler(async (req, res) => {
  const doc = await stockAdjustmentService.create(req.validated.body, req.user.id);
  return successResponse(res, { statusCode: 201, message: 'Penyesuaian stok berhasil', data: stockAdjustmentMapper.toResponse(doc) });
});

export const getAdjustments = asyncHandler(async (req, res) => {
  const result = await stockAdjustmentService.findAll(req.validated.query);
  return successResponse(res, { data: stockAdjustmentMapper.toList(result.data), pagination: result.pagination });
});