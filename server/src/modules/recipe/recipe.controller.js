import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';

import recipeMapper from './recipe.mapper.js';
import recipeService from './recipe.service.js';

export const createRecipe = asyncHandler(
  async (req, res) => {
    const recipe = await recipeService.create(
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      statusCode: 201,
      message: 'Recipe created successfully',
      data: recipeMapper.toDetail(recipe),
    });
  }
);

export const getRecipes = asyncHandler(
  async (req, res) => {
    const result = await recipeService.findAll(
      req.validated.query
    );

    return successResponse(res, {
      data: recipeMapper.toList(result.data),
      pagination: result.pagination,
    });
  }
);

export const getRecipeById = asyncHandler(
  async (req, res) => {
    const recipe = await recipeService.findById(
      req.validated.params.id
    );

    return successResponse(res, {
      data: recipeMapper.toDetail(recipe),
    });
  }
);

export const deleteRecipe = asyncHandler(
  async (req, res) => {
    await recipeService.delete(
      req.validated.params.id,
      req.user.id
    );

    return successResponse(res, {
      message: 'Recipe deleted successfully',
    });
  }
);

export const updateRecipe = asyncHandler(
  async (req, res) => {
    const recipe = await recipeService.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      message: 'Recipe updated successfully',
      data: recipeMapper.toDetail(recipe),
    });
  }
);
