import Category from './category.model.js';
import { buildPagination, buildSearch, buildSort } from '#shared/utils/query.utils';

class CategoryRepository {
  async create(payload, session = null) {
    const [category] = await Category.create([payload], { session });

    return category;
  }

  findById(id) {
    return Category.findOne({
      _id: id,
      isDeleted: false,
    });
  }

  findByName(name) {
    return Category.findOne({
      name,
      isDeleted: false,
    });
  }

  async findAll(query) {
    const { page, limit, skip } = buildPagination(query);

    const filter = {
      isDeleted: false,
      ...buildSearch(query.search, ['name']),
    };

    const sort = buildSort(query, ['name', 'createdAt', 'updatedAt']);

    const [items, total] = await Promise.all([
      Category.find(filter).sort(sort).skip(skip).limit(limit),

      Category.countDocuments(filter),
    ]);

    return {
      items,
      total,
    };
  }
  update(id, payload, session = null) {
    return Category.findOneAndUpdate(
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

  softDelete(id, deletedBy, session = null) {
    return Category.findOneAndUpdate(
      {
        _id: id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy,
      },
      {
        new: true,
        session,
      }
    );
  }
}

export default new CategoryRepository();
