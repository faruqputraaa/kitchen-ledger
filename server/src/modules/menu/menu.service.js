import NotFoundError from '#shared/errors/NotFoundError';
import ValidationError from '#shared/errors/ValidationError';

import menuRepository from './menu.repository.js';
import recipeRepository from '../recipe/recipe.repository.js';

class MenuService {
  async create(dto, userId) {
    // Validate recipe exists
    const recipe = await recipeRepository.findById(dto.recipe);
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    const menu = await menuRepository.create({
      ...dto,
      createdBy: userId,
    });

    return menu;
  }

  async findAll(query) {
    const result = await menuRepository.findMany(query);
    return {
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findById(id) {
    const menu = await menuRepository.findById(id);
    if (!menu) {
      throw new NotFoundError('Menu not found');
    }
    return menu;
  }

  async update(id, dto, userId) {
    const existing = await menuRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Menu not found');
    }

    // If recipe changed, validate new recipe exists
    if (dto.recipe && dto.recipe !== existing.recipe.toString()) {
      const recipe = await recipeRepository.findById(dto.recipe);
      if (!recipe) {
        throw new NotFoundError('Recipe not found');
      }
    }

    const patch = { updatedBy: userId };
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.sellingPrice !== undefined) patch.sellingPrice = dto.sellingPrice;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.recipe !== undefined) patch.recipe = dto.recipe;

    const updated = await menuRepository.update(
      { _id: existing._id, isDeleted: false },
      patch
    );

    return updated;
  }

  async delete(id, userId) {
    const menu = await this.findById(id);

    await menuRepository.softDelete(
      { _id: id, isDeleted: false },
      userId
    );

    return { deleted: true };
  }
}

export default new MenuService();