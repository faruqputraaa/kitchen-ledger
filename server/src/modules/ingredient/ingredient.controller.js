import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';

import ingredientMapper from './ingredient.mapper.js';
import ingredientService from './ingredient.service.js';
import { ingredientPriceHistoryRepository } from '../ingredient-price-history/index.js';

export const createIngredient = asyncHandler(async (req, res) => {
  const ingredient = await ingredientService.create(req.validated.body, req.user.id);

  return successResponse(res, {
    statusCode: 201,
    message: 'Ingredient created successfully',
    data: ingredientMapper.toResponse(ingredient),
  });
});

export const getIngredients = asyncHandler(async (req, res) => {
  const result = await ingredientService.findAll(req.validated.query);

  return successResponse(res, {
    data: ingredientMapper.toList(result.data),
    pagination: result.pagination,
  });
});

export const getIngredientById = asyncHandler(async (req, res) => {
  const ingredient = await ingredientService.findById(req.validated.params.id);

  return successResponse(res, {
    data: ingredientMapper.toResponse(ingredient),
  });
});

export const updateIngredient = asyncHandler(async (req, res) => {
  const ingredient = await ingredientService.update(
    req.validated.params.id,
    req.validated.body,
    req.user.id
  );

  return successResponse(res, {
    message: 'Ingredient updated successfully',
    data: ingredientMapper.toResponse(ingredient),
  });
});

export const deleteIngredient = asyncHandler(async (req, res) => {
  await ingredientService.delete(req.validated.params.id, req.user.id);

  return successResponse(res, {
    message: 'Ingredient deleted successfully',
  });
});

export const getIngredientPriceHistory = asyncHandler(async (req, res) => {
    const history = await ingredientPriceHistoryRepository.findMany(
      { ingredient: req.params.id },
      { sort: { date: 1 }, limit: 365 }
    );

    return successResponse(res, {
      data: history.map((h) => ({
        date: h.date,
        lastPrice: h.lastPrice,
        purchaseId: h.purchaseId,
      })),
    });
  });
