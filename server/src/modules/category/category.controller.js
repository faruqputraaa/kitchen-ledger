import asyncHandler from '#utils/asyncHandler';

import { successResponse } from '#response/apiResponse';

import categoryMapper from './category.mapper.js';
import categoryService from './category.service.js';

export const create = asyncHandler(async (req, res) => {
  const category = await categoryService.create(req.validated.body, req.user.id);

  return successResponse(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: categoryMapper.toResponse(category),
  });
});

export const findAll = asyncHandler(async (req, res) => {
  const result = await categoryService.findAll(req.validated.query);

  return successResponse(res, {
    data: categoryMapper.toList(result.data),
    pagination: result.pagination,
  });
});

export const findById = asyncHandler(async (req, res) => {
  const category = await categoryService.findById(req.validated.params.id);

  return successResponse(res, {
    data: categoryMapper.toResponse(category),
  });
});

export const update = asyncHandler(async (req, res) => {
  const category = await categoryService.update(
    req.validated.params.id,
    req.validated.body,
    req.user.id
  );

  return successResponse(res, {
    message: 'Category updated successfully',
    data: categoryMapper.toResponse(category),
  });
});

export const remove = asyncHandler(async (req, res) => {
  await categoryService.delete(req.validated.params.id, req.user.id);

  return successResponse(res, {
    message: 'Category deleted successfully',
  });
});
