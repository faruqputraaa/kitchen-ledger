import Unit from './unit.model.js';

import {
  buildPagination,
  buildSearch,
  buildSort,
} from '#shared/utils/query.utils';

class UnitRepository {
  create(payload, session = null) {
    return Unit.create([payload], { session }).then(
      ([doc]) => doc
    );
  }

  findOne(filter) {
    return Unit.findOne(filter);
  }

  findById(id) {
    return Unit.findOne({
      _id: id,
      isDeleted: false,
    });
  }

  async findAll(query) {
    const { page, limit, skip } =
      buildPagination(query);

    const filter = {
      isDeleted: false,
      ...buildSearch(query.search, [
        'name',
        'symbol',
      ]),
    };

    const sort = buildSort(query, [
      'name',
      'symbol',
      'createdAt',
      'updatedAt',
    ]);

    const [items, total] =
      await Promise.all([
        Unit.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit),

        Unit.countDocuments(filter),
      ]);

    return {
      items,
      total,
      page,
      limit,
    };
  }

  update(id, payload, session = null) {
    return Unit.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      payload,
      {
        new: true,
        runValidators: true,
        session,
      }
    );
  }

  softDelete(id, userId, session = null) {
    return Unit.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
      },
      {
        new: true,
        session,
      }
    );
  }
}

export default new UnitRepository();