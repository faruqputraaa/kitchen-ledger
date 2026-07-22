import ConflictError from '#shared/errors/ConflictError';
import NotFoundError from '#shared/errors/NotFoundError';
import ValidationError from '#shared/errors/ValidationError';

import withTransaction from '#shared/database/transaction';
import counterService from '#shared/counter/counter.service';

import recipeRepository, {
  recipeItemRepository,
} from './recipe.repository.js';
import ingredientRepository from '../ingredient/ingredient.repository.js';
import unitRepository from '../unit/unit.repository.js';

// hitung lineCost 1 item dengan konversi unit (pakai lastPrice)
const computeLineCost = (
  quantity,
  recipeUnit,
  ingredientUnit,
  lastPrice
) => {
  if (recipeUnit.dimension !== ingredientUnit.dimension) {
    throw new ValidationError(
      `Unit dimension mismatch: resep pakai ${recipeUnit.symbol} (${recipeUnit.dimension}), ingredient pakai ${ingredientUnit.symbol} (${ingredientUnit.dimension})`
    );
  }

  // qty resep -> qty dalam unit ingredient
  const qtyInIngredientUnit =
    quantity *
    (recipeUnit.baseFactor / ingredientUnit.baseFactor);

  return (
    Math.round(
      qtyInIngredientUnit * lastPrice * 100
    ) / 100
  );
};

class RecipeService {
  async create(dto, userId) {
    return withTransaction(async (session) => {
      const code = await counterService.generate(
        'recipe',
        session
      );

      const items = [];

      for (const it of dto.items) {
        const ingredient =
          await ingredientRepository.findById(
            it.ingredient,
            { session }
          );

        if (!ingredient) {
          throw new NotFoundError(
            `Ingredient ${it.ingredient} not found`
          );
        }

        const recipeUnit = await unitRepository.findById(
          it.unit
        );

        if (!recipeUnit) {
          throw new NotFoundError(
            `Unit ${it.unit} not found`
          );
        }

        // unit ingredient (bisa populated / ObjectId)
        const ingredientUnitId =
          ingredient.unit?._id ?? ingredient.unit;

        const ingredientUnit =
          await unitRepository.findById(
            ingredientUnitId
          );

        if (!ingredientUnit) {
          throw new NotFoundError(
            'Ingredient unit not found'
          );
        }

        // validasi dimension tapi lineCost dihitung via virtual foodCost (pakai lastPrice)
        if (recipeUnit.dimension !== ingredientUnit.dimension) {
          throw new ValidationError(
            `Unit dimension mismatch: resep pakai ${recipeUnit.symbol} (${recipeUnit.dimension}), ingredient pakai ${ingredientUnit.symbol} (${ingredientUnit.dimension})`
          );
        }

        items.push({
          recipe: null,
          ingredient: it.ingredient,
          unit: it.unit,
          quantity: it.quantity,
        });
      }

      const recipe = await recipeRepository.create(
        {
          code,
          name: dto.name,
          description: dto.description ?? '',
          status: dto.status ?? 'ACTIVE',
          note: dto.note ?? '',
          createdBy: userId,
        },
        session
      );

      const itemsWithRef = items.map((it) => ({
        ...it,
        recipe: recipe._id,
      }));

      await recipeItemRepository.createMany(
        itemsWithRef,
        session
      );

      const created = await recipeRepository.findById(
        recipe._id,
        { session }
      );

      const recipeItems =
        await recipeItemRepository.findByRecipe(
          recipe._id,
          session
        );

      return {
        ...created.toObject(),
        items: recipeItems.map((ri) =>
          this._mapItem(ri)
        ),
      };
    });
  }

  async findAll(query) {
    const result = await recipeRepository.findMany(query);

    // Fetch items for each recipe separately (virtual populate not supported in pagination)
    const recipesWithItems = await Promise.all(
      result.items.map(async (recipe) => {
        const recipeItems = await recipeItemRepository.findByRecipe(
          recipe._id
        );

        // Populate ingredient for each item
        await Promise.all(
          recipeItems.map(async (ri) => {
            await ri.populate({
              path: 'ingredient',
              select: 'code name lastPrice unit',
              populate: {
                path: 'unit',
                select: 'code name symbol dimension baseFactor',
              },
            });
          })
        );

        return {
          ...recipe.toObject(),
          items: recipeItems.map((ri) => this._mapItem(ri)),
        };
      })
    );

    return {
      data: recipesWithItems,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(
          result.total / result.limit
        ),
      },
    };
  }

  async findById(id) {
    const recipe = await recipeRepository.findById(id);

    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    // Fetch items separately (virtual populate not supported)
    const recipeItems = await recipeItemRepository.findByRecipe(
      recipe._id
    );

    // Populate ingredient for each item
    await Promise.all(
      recipeItems.map(async (ri) => {
        await ri.populate({
          path: 'ingredient',
          select: 'code name lastPrice unit',
          populate: {
            path: 'unit',
            select: 'code name symbol dimension baseFactor',
          },
        });
      })
    );

    return {
      ...recipe.toObject(),
      items: recipeItems.map((ri) => this._mapItem(ri)),
    };
  }

  async update(id, dto, userId) {
    return withTransaction(async (session) => {
      const existing = await recipeRepository.findById(
        id,
        { session }
      );

      if (!existing) {
        throw new NotFoundError('Recipe not found');
      }

      const patch = {
        updatedBy: userId,
      };

      if (dto.name !== undefined) patch.name = dto.name;
      if (dto.description !== undefined)
        patch.description = dto.description;
      if (dto.status !== undefined)
        patch.status = dto.status;
      if (dto.note !== undefined) patch.note = dto.note;

      // kalau items dikirim -> replace
      if (dto.items) {
        // validasi dimension
        for (const it of dto.items) {
          const ingredient =
            await ingredientRepository.findById(
              it.ingredient,
              { session }
            );

          if (!ingredient) {
            throw new NotFoundError(
              `Ingredient ${it.ingredient} not found`
            );
          }

          const recipeUnit =
            await unitRepository.findById(it.unit);

          if (!recipeUnit) {
            throw new NotFoundError(
              `Unit ${it.unit} not found`
            );
          }

          const ingredientUnitId =
            ingredient.unit?._id ?? ingredient.unit;

          const ingredientUnit =
            await unitRepository.findById(
              ingredientUnitId
            );

          if (!ingredientUnit) {
            throw new NotFoundError(
              'Ingredient unit not found'
            );
          }

          if (recipeUnit.dimension !== ingredientUnit.dimension) {
            throw new ValidationError(
              `Unit dimension mismatch: resep pakai ${recipeUnit.symbol} (${recipeUnit.dimension}), ingredient pakai ${ingredientUnit.symbol} (${ingredientUnit.dimension})`
            );
          }
        }

        await recipeItemRepository.deleteByRecipe(
          existing._id,
          session
        );

        const itemsWithRef = dto.items.map((it) => ({
          recipe: existing._id,
          ingredient: it.ingredient,
          unit: it.unit,
          quantity: it.quantity,
        }));

        await recipeItemRepository.createMany(
          itemsWithRef,
          session
        );
      }

      await recipeRepository.update(
        { _id: existing._id, isDeleted: false },
        patch,
        { session }
      );

      const updated = await recipeRepository.findById(
        existing._id,
        { session }
      );

      await updated.populate({
        path: 'items',
        populate: {
          path: 'ingredient',
          select: 'code name lastPrice unit',
          populate: {
            path: 'unit',
            select: 'code name symbol dimension baseFactor',
          },
        },
      });

      return {
        ...updated.toObject(),
        items: updated.items.map((ri) =>
          this._mapItem(ri)
        ),
      };
    });
  }

  async delete(id, userId) {
    const recipe = await this.findById(id);

    return withTransaction(async (session) => {
      await recipeItemRepository.deleteByRecipe(
        recipe._id,
        session
      );

      return recipeRepository.softDelete(
        { _id: id, isDeleted: false },
        userId,
        { session }
      );
    });
  }

  // mapping 1 recipe item + hitung lineCost live (pakai lastPrice)
  _mapItem(ri) {
    const ingredient = ri.ingredient;
    const recipeUnit = ri.unit;
    const ingredientUnitObj = ingredient?.unit;

    let lineCost = null;

    try {
      if (
        recipeUnit?.dimension &&
        ingredientUnitObj?.dimension &&
        ingredient?.lastPrice != null
      ) {
        lineCost = computeLineCost(
          ri.quantity,
          recipeUnit,
          ingredientUnitObj,
          ingredient.lastPrice
        );
      }
    } catch (e) {
      lineCost = null;
    }

    const ingredientUnitId = ingredientUnitObj?._id ?? ingredient?.unit;

    return {
      id: ri._id.toString(),
      ingredient: {
        id: ingredient._id.toString(),
        code: ingredient.code,
        name: ingredient.name,
        lastPrice: ingredient.lastPrice,
        unit: ingredientUnitObj
          ? {
              id: ingredientUnitObj._id.toString(),
              code: ingredientUnitObj.code,
              name: ingredientUnitObj.name,
              symbol: ingredientUnitObj.symbol,
            }
          : ingredientUnitId,
      },
      unit: recipeUnit?._id
        ? {
            id: recipeUnit._id.toString(),
            symbol: recipeUnit.symbol,
            name: recipeUnit.name,
          }
        : recipeUnit,
      quantity: ri.quantity,
      lineCost,
    };
  }
}

export default new RecipeService()