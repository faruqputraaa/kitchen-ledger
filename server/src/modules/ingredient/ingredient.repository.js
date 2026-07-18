import Ingredient from './ingredient.model.js';

import {
  INGREDIENT_POPULATE,
  INGREDIENT_SEARCH_FIELDS,
  INGREDIENT_SORT_FIELDS,
} from './ingredient.constants.js';

import { buildSearch } from '#shared/database/search.util';
import { buildQueryOptions } from '#shared/database/query.util';
import { executePagination } from '#shared/database/mongoose.util';

class IngredientRepository {
  async create(data, session = null) {
    const [ingredient] = await Ingredient.create(
      [data],
      {
        session,
      }
    );

    return ingredient.populate(
      INGREDIENT_POPULATE
    );
  }

  async findOne(
    filter = {},
    options = {}
  ) {
    let query =
      Ingredient.findOne(filter);

    if (options.populate !== false) {
      query = query.populate(
        options.populate ??
          INGREDIENT_POPULATE
      );
    }

    if (options.select) {
      query = query.select(
        options.select
      );
    }

    if (options.session) {
      query = query.session(
        options.session
      );
    }

    if (options.lean) {
      query = query.lean();
    }

    return query;
  }

  async findById(
    id,
    options = {}
  ) {
    return this.findOne(
      {
        _id: id,
        isDeleted: false,
      },
      options
    );
  }

  async findMany(
    query = {}
  ) {
    const filter = {
      isDeleted: false,

      ...buildSearch(
        query.search,
        INGREDIENT_SEARCH_FIELDS
      ),
    };

    const options =
      buildQueryOptions({
        query,

        allowedSort:
          INGREDIENT_SORT_FIELDS,
      });

    return executePagination({
      model: Ingredient,

      filter,

      options,

      populate:
        INGREDIENT_POPULATE,
    });
  }

  async count(
    filter = {}
  ) {
    return Ingredient.countDocuments(
      filter
    );
  }

  async update(
    filter,
    data,
    options = {}
  ) {
    let query =
      Ingredient.findOneAndUpdate(
        filter,
        data,
        {
          new: true,
          runValidators: true,
          session:
            options.session,
        }
      );

    if (
      options.populate !== false
    ) {
      query = query.populate(
        options.populate ??
          INGREDIENT_POPULATE
      );
    }

    return query;
  }

  async softDelete(
    filter,
    deletedBy,
    options = {}
  ) {
    return Ingredient.findOneAndUpdate(
      filter,
      {
        isDeleted: true,

        deletedAt:
          new Date(),

        deletedBy,
      },
      {
        new: true,

        session:
          options.session,
      }
    );
  }
}

export default new IngredientRepository();