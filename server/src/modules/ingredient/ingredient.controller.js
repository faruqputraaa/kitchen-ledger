import ingredientService from './ingredient.service.js';
import { successResponse } from '#shared/response/apiResponse';

class IngredientController {
  async createIngredient(req, res, next) {
    try {
      const ingredient = await ingredientService.create(
        req.validated.body,
        req.user.id
      );

      return successResponse(
        res,
        ingredient,
        'Ingredient created successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async getIngredients(req, res, next) {
    try {
      const result = await ingredientService.findAll(
        req.validated.query
      );

      return successResponse(
        res,
        result.data,
        'Ingredients retrieved successfully',
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  async getIngredientById(req, res, next) {
    try {
      const ingredient =
        await ingredientService.findById(
          req.validated.params.id
        );

      return successResponse(
        res,
        ingredient,
        'Ingredient retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async updateIngredient(req, res, next) {
    try {
      const ingredient =
        await ingredientService.update(
          req.validated.params.id,
          req.validated.body,
          req.user.id
        );

      return successResponse(
        res,
        ingredient,
        'Ingredient updated successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteIngredient(req, res, next) {
    try {
      await ingredientService.delete(
        req.validated.params.id,
        req.user.id
      );

      return successResponse(
        res,
        null,
        'Ingredient deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new IngredientController();