import Recipe from './recipe.model.js';
import RecipeItem from './recipeItem.model.js';

import {
  RECIPE_POPULATE,
  RECIPE_SEARCH_FIELDS,
  RECIPE_SORT_FIELDS,
} from './recipe.constants.js';

import { buildSearch } from '#shared/database/search.util';
import { buildQueryOptions } from '#shared/database/query.util';
import { executePagination } from '#shared/database/mongoose.util';

class RecipeRepository {
  async create(data, session = null) {
    const [recipe] = await Recipe.create(
      [data],
      { session }
    );

    return recipe.populate(RECIPE_POPULATE);
  }

  async findOne(filter = {}, options = {}) {
    let query = Recipe.findOne(filter);

    if (options.populate !== false) {
      query = query.populate(
        options.populate ?? RECIPE_POPULATE
      );
    }

    if (options.session) {
      query = query.session(options.session);
    }

    return query;
  }

  async findById(id, options = {}) {
    return this.findOne(
      { _id: id, isDeleted: false },
      options
    );
  }

  async findMany(query = {}) {
    const filter = {
      isDeleted: false,
      ...buildSearch(
        query.search,
        RECIPE_SEARCH_FIELDS
      ),
    };

    // Add status filter if provided
    if (query.status) {
      filter.status = query.status;
    }

    const options = buildQueryOptions({
      query,
      allowedSort: RECIPE_SORT_FIELDS,
    });

    return executePagination({
      model: Recipe,
      filter,
      options,
      populate: null, // Items di-handle di service
    });
  }

  async update(filter, data, options = {}) {
    return Recipe.findOneAndUpdate(
      filter,
      data,
      {
        new: true,
        runValidators: true,
        session: options.session,
      }
    ).populate(RECIPE_POPULATE);
  }

  async softDelete(filter, deletedBy, options = {}) {
    return Recipe.findOneAndUpdate(
      filter,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
      { new: true, session: options.session }
    );
  }
}

class RecipeItemRepository {
  async createMany(items, session = null) {
    return RecipeItem.insertMany(items, { session });
  }

    async findByRecipe(recipeId, session = null) {
    let query = RecipeItem.find({ recipe: recipeId });

    if (session) {
      query = query.session(session);
    }

    return query.populate([
      {
        path: 'ingredient',
        select: 'code name lastPrice unit',
        populate: {
          path: 'unit',
          select: 'code name symbol dimension baseFactor',
        },
      },
      {
        path: 'unit',
        select: 'code name symbol dimension baseFactor',
      },
    ]);
  }


  async deleteByRecipe(recipeId, session = null) {
    return RecipeItem.deleteMany(
      { recipe: recipeId },
      { session }
    );
  }
}

export default new RecipeRepository();
export const recipeItemRepository =
  new RecipeItemRepository();