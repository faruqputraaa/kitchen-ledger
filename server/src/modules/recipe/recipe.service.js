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

// hitung lineCost 1 item dengan konversi unit
const computeLineCost = (
  quantity,
  recipeUnit,
  ingredientUnit,
  averagePrice
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
      qtyInIngredientUnit * averagePrice * 100
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
      let foodCost = 0;

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

         const lineCost = computeLineCost(
          it.quantity,
          recipeUnit,
          ingredientUnit,
          ingredient.averagePrice
        );

        foodCost += lineCost;

        items.push({
          recipe: null,
          ingredient: it.ingredient,
          unit: it.unit,
          quantity: it.quantity,
        });
      }

      foodCost = Math.round(foodCost * 100) / 100;

      const recipe = await recipeRepository.create(
        {
          code,
          name: dto.name,
          description: dto.description ?? '',
          status: dto.status ?? 'ACTIVE',
          note: dto.note ?? '',
          foodCost,
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

    return {
      data: result.items,
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

    const items = await recipeItemRepository.findByRecipe(
      recipe._id
    );

    return {
      ...recipe.toObject(),
      items: items.map((ri) => this._mapItem(ri)),
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

      // kalau items dikirim -> replace + recompute foodCost
      if (dto.items) {
        const items = [];
        let foodCost = 0;

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

          foodCost += computeLineCost(
            it.quantity,
            recipeUnit,
            ingredientUnit,
            ingredient.averagePrice
          );

          items.push({
            recipe: existing._id,
            ingredient: it.ingredient,
            unit: it.unit,
            quantity: it.quantity,
          });
        }

        patch.foodCost =
          Math.round(foodCost * 100) / 100;

        await recipeItemRepository.deleteByRecipe(
          existing._id,
          session
        );

        await recipeItemRepository.createMany(
          items,
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

      const recipeItems =
        await recipeItemRepository.findByRecipe(
          existing._id,
          session
        );

      return {
        ...updated.toObject(),
        items: recipeItems.map((ri) =>
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

  // mapping 1 recipe item + hitung lineCost live
  _mapItem(ri) {
    const ingredient = ri.ingredient;
    const recipeUnit = ri.unit;
    const ingredientUnit =
      ingredient?.unit?._id ?? ingredient?.unit;

    let lineCost = null;

    // hitung hanya kalau unit ter-populate lengkap
    if (
      recipeUnit?.dimension &&
      ingredient?.unit?.dimension
    ) {
      lineCost = computeLineCost(
        ri.quantity,
        recipeUnit,
        ingredient.unit,
        ingredient.averagePrice
      );
    }

    return {
      id: ri._id.toString(),
      ingredient: {
        id: ingredient._id.toString(),
        code: ingredient.code,
        name: ingredient.name,
        averagePrice: ingredient.averagePrice,
        unit: ingredientUnit,
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

export default new RecipeService();