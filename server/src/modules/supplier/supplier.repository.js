import Supplier from './supplier.model.js';

import { buildSearch } from '#shared/database/search.util';
import { buildQueryOptions } from '#shared/database/query.util';
import { executePagination } from '#shared/database/mongoose.util';

class SupplierRepository {
  async create(data, session = null) {
    const [supplier] = await Supplier.create([data], {
      session,
    });

    return supplier;
  }

  async findOne(filter = {}, options = {}) {
    let query = Supplier.findOne(filter);

    if (options.select) {
      query = query.select(options.select);
    }

    if (options.populate) {
      query = query.populate(options.populate);
    }

    if (options.session) {
      query = query.session(options.session);
    }

    if (options.lean) {
      query = query.lean();
    }

    return query;
  }

  async findById(id, options = {}) {
    return this.findOne(
      {
        _id: id,
        isDeleted: false,
      },
      options
    );
  }

  async findMany(query = {}) {
    const filter = {
      isDeleted: false,
      ...buildSearch(query.search, ['name', 'contactPerson', 'phone']),
    };

    const options = buildQueryOptions({
      query,
      allowedSort: ['name', 'contactPerson', 'createdAt', 'updatedAt'],
    });

    return executePagination({
      model: Supplier,
      filter,
      options,
    });
  }

  async count(filter = {}) {
    return Supplier.countDocuments(filter);
  }

  async update(filter, data, options = {}) {
    return Supplier.findOneAndUpdate(filter, data, {
      new: true,
      runValidators: true,
      session: options.session,
    });
  }

  async softDelete(filter, deletedBy, options = {}) {
    return Supplier.findOneAndUpdate(
      filter,
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
      {
        new: true,
        session: options.session,
      }
    );
  }
}

export default new SupplierRepository();
