import Menu from './menu.model.js';

import {
  MENU_POPULATE,
  MENU_SEARCH_FIELDS,
  MENU_SORT_FIELDS,
} from './menu.constants.js';

import { buildSearch } from '#shared/database/search.util';
import { buildQueryOptions } from '#shared/database/query.util';
import { executePagination } from '#shared/database/mongoose.util';

class MenuRepository {
  async create(data, session = null) {
    const [menu] = await Menu.create([data], { session });
    return menu.populate(MENU_POPULATE);
  }

  async findOne(filter = {}, options = {}) {
    let query = Menu.findOne(filter);

    if (options.populate !== false) {
      query = query.populate(options.populate ?? MENU_POPULATE);
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
      ...buildSearch(query.search, MENU_SEARCH_FIELDS),
    };

    if (query.status) filter.status = query.status;
    if (query.recipe) filter.recipe = query.recipe;

    const options = buildQueryOptions({
      query,
      allowedSort: MENU_SORT_FIELDS,
    });

    return executePagination({
      model: Menu,
      filter,
      options,
      populate: MENU_POPULATE,
    });
  }

  async update(filter, data, options = {}) {
    return Menu.findOneAndUpdate(
      filter,
      data,
      {
        new: true,
        runValidators: true,
        session: options.session,
      }
    ).populate(MENU_POPULATE);
  }

  async softDelete(filter, deletedBy, options = {}) {
    return Menu.findOneAndUpdate(
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

export default new MenuRepository();