import asyncHandler from '#shared/utils/asyncHandler';
import { successResponse } from '#shared/response/apiResponse';

import menuMapper from './menu.mapper.js';
import menuService from './menu.service.js';
import menuRepository from './menu.repository.js';
import recipeRepository from '../recipe/recipe.repository.js';

export const createMenu = asyncHandler(
  async (req, res) => {
    const menu = await menuService.create(
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      statusCode: 201,
      message: 'Menu created successfully',
      data: menuMapper.toDetail(menu),
    });
  }
);

export const getMenus = asyncHandler(
  async (req, res) => {
    const result = await menuService.findAll(
      req.validated.query
    );

    return successResponse(res, {
      data: menuMapper.toList(result.data),
      pagination: result.pagination,
    });
  }
);

export const getMenuById = asyncHandler(
  async (req, res) => {
    const menu = await menuService.findById(
      req.validated.params.id
    );

    return successResponse(res, {
      data: menuMapper.toDetail(menu),
    });
  }
);

export const deleteMenu = asyncHandler(
  async (req, res) => {
    await menuService.delete(
      req.validated.params.id,
      req.user.id
    );

    return successResponse(res, {
      message: 'Menu deleted successfully',
    });
  }
);

export const updateMenu = asyncHandler(
  async (req, res) => {
    const menu = await menuService.update(
      req.validated.params.id,
      req.validated.body,
      req.user.id
    );

    return successResponse(res, {
      message: 'Menu updated successfully',
      data: menuMapper.toDetail(menu),
    });
  }
);