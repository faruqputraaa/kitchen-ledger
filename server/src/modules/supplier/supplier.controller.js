import asyncHandler from '#shared/utils/asyncHandler';

import { successResponse } from '#shared/response/apiResponse';

import supplierMapper from './supplier.mapper.js';
import supplierService from './supplier.service.js';

export const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.create(req.validated.body, req.user.id);

  return successResponse(res, {
    statusCode: 201,
    message: 'Supplier created successfully',
    data: supplierMapper.toResponse(supplier),
  });
});

export const getSuppliers = asyncHandler(async (req, res) => {
  const result = await supplierService.findAll(req.validated.query);

  return successResponse(res, {
    data: supplierMapper.toList(result.data),
    pagination: result.pagination,
  });
});

export const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.findById(req.validated.params.id);

  return successResponse(res, {
    data: supplierMapper.toResponse(supplier),
  });
});

export const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.update(
    req.validated.params.id,
    req.validated.body,
    req.user.id
  );

  return successResponse(res, {
    message: 'Supplier updated successfully',
    data: supplierMapper.toResponse(supplier),
  });
});

export const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.delete(req.validated.params.id, req.user.id);

  return successResponse(res, {
    message: 'Supplier deleted successfully',
  });
});
