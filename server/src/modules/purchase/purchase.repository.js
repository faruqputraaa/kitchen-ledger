import Purchase from './purchase.model.js';
import PurchaseItem from './purchaseItem.model.js';

import {
  PURCHASE_POPULATE,
  PURCHASE_SEARCH_FIELDS,
  PURCHASE_SORT_FIELDS,
} from './purchase.constants.js';

import { buildSearch } from '#shared/database/search.util';
import { buildQueryOptions } from '#shared/database/query.util';
import { executePagination } from '#shared/database/mongoose.util';

class PurchaseRepository {
  async create(data, session = null) {
    const [purchase] = await Purchase.create(
      [data],
      { session }
    );

    return purchase.populate(PURCHASE_POPULATE);
  }

  async findOne(filter = {}, options = {}) {
    let query = Purchase.findOne(filter);

    if (options.populate !== false) {
      query = query.populate(
        options.populate ?? PURCHASE_POPULATE
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
        PURCHASE_SEARCH_FIELDS
      ),
    };

    const options = buildQueryOptions({
      query,
      allowedSort: PURCHASE_SORT_FIELDS,
    });

    return executePagination({
      model: Purchase,
      filter,
      options,
      populate: PURCHASE_POPULATE,
    });
  }

  async update(filter, data, options = {}) {
    return Purchase.findOneAndUpdate(
      filter,
      data,
      {
        new: true,
        runValidators: true,
        session: options.session,
      }
    ).populate(PURCHASE_POPULATE);
  }

  async softDelete(filter, deletedBy, options = {}) {
    return Purchase.findOneAndUpdate(
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

class PurchaseItemRepository {
  async createMany(items, session = null) {
    return PurchaseItem.insertMany(items, { session });
  }

    async findByPurchase(purchaseId, session = null) {
    let query = PurchaseItem.find({ purchase: purchaseId });

    if (session) {
      query = query.session(session);
    }

    return query;
  }


  async deleteByPurchase(purchaseId, session = null) {
    return PurchaseItem.deleteMany(
      { purchase: purchaseId },
      { session }
    );
  }
}

export default new PurchaseRepository();
export const purchaseItemRepository =
  new PurchaseItemRepository();