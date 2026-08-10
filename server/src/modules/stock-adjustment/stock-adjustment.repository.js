import StockAdjustment from './stock-adjustment.model.js';
import {
  STOCK_ADJUSTMENT_POPULATE,
  STOCK_ADJUSTMENT_SEARCH_FIELDS,
  STOCK_ADJUSTMENT_SORT_FIELDS,
} from './stock-adjustment.constants.js';
import { buildSearch } from '#shared/database/search.util';
import { buildQueryOptions } from '#shared/database/query.util';
import { executePagination } from '#shared/database/mongoose.util';

class StockAdjustmentRepository {
  async create(data, session = null) {
    const [doc] = await StockAdjustment.create([data], { session });
    return doc.populate(STOCK_ADJUSTMENT_POPULATE);
  }

  async findById(id, options = {}) {
    let q = StockAdjustment.findOne({ _id: id, isDeleted: false });
    q = q.populate(options.populate ?? STOCK_ADJUSTMENT_POPULATE);
    if (options.session) q = q.session(options.session);
    return q;
  }

  async findMany(query = {}) {
    const filter = {
      isDeleted: false,
      ...buildSearch(query.search, STOCK_ADJUSTMENT_SEARCH_FIELDS),
    };
    if (query.ingredient) filter.ingredient = query.ingredient;
    if (query.type) filter.type = query.type;

    const options = buildQueryOptions({ query, allowedSort: STOCK_ADJUSTMENT_SORT_FIELDS });
    return executePagination({ model: StockAdjustment, filter, options, populate: STOCK_ADJUSTMENT_POPULATE });
  }
}

export default new StockAdjustmentRepository();