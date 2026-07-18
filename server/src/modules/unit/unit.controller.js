import asyncHandler from '#shared/utils/asyncHandler';

import { successResponse } from '#shared/response/apiResponse';

import unitMapper from './unit.mapper.js';
import unitService from './unit.service.js';

export const createUnit = asyncHandler(
  async (req, res) => {
    const unit = await unitService.create(
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      statusCode: 201,
      message: 'Unit created successfully',
      data: unitMapper.toResponse(unit),
    });
  }
);

export const getUnits = asyncHandler(
  async (req, res) => {
    const result = await unitService.findAll(
      req.validated.query
    );

    return successResponse(res, {
      data: unitMapper.toList(result.data),
      pagination: result.pagination,
    });
  }
);

export const getUnitById = asyncHandler(
  async (req, res) => {
    const unit = await unitService.findById(
      req.validated.params.id
    );

    return successResponse(res, {
      data: unitMapper.toResponse(unit),
    });
  }
);

export const updateUnit = asyncHandler(
  async (req, res) => {
    const unit = await unitService.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      message: 'Unit updated successfully',
      data: unitMapper.toResponse(unit),
    });
  }
);

export const deleteUnit = asyncHandler(
  async (req, res) => {
    await unitService.delete(
      req.validated.params.id,
      req.user.id
    );

    return successResponse(res, {
      message: 'Unit deleted successfully',
    });
  }
);