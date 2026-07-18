import ConflictError from '#shared/errors/ConflictError';
import NotFoundError from '#shared/errors/NotFoundError';

import counterService from '#shared/counter/counter.service';

import ingredientRepository from './ingredient.repository.js';
import categoryRepository from '../category/category.repository.js';
import unitRepository from '../unit/unit.repository.js';

class IngredientService {
  async create(
    dto,
    userId,
    session = null
  ) {
    const duplicate =
      await ingredientRepository.findOne(
        {
          name: dto.name,
          isDeleted: false,
        },
        {
          session,
          populate: false,
        }
      );

    if (duplicate) {
      throw new ConflictError(
        'Ingredient name already exists'
      );
    }

    const category =
      await categoryRepository.findById(
        dto.category,
        {
          session,
        }
      );

    if (!category) {
      throw new NotFoundError(
        'Category not found'
      );
    }

    const unit =
      await unitRepository.findById(
        dto.unit,
        {
          session,
        }
      );

    if (!unit) {
      throw new NotFoundError(
        'Unit not found'
      );
    }

    const code =
      await counterService.generate(
        'ingredient',
        session
      );

    return ingredientRepository.create(
      {
        code,

        name: dto.name,

        category: dto.category,

        unit: dto.unit,

        minimumStock:
          dto.minimumStock ?? 0,

        currentStock: 0,

        averagePrice: 0,

        notes: dto.notes ?? '',

        createdBy: userId,
      },
      session
    );
  }

  async findAll(query) {
    const result =
      await ingredientRepository.findMany(
        query
      );

    return {
      data: result.items,

      pagination: {
        page: result.page,

        limit: result.limit,

        total: result.total,

        totalPages: Math.ceil(
          result.total /
            result.limit
        ),
      },
    };
  }

  async findById(id) {
    const ingredient =
      await ingredientRepository.findById(
        id
      );

    if (!ingredient) {
      throw new NotFoundError(
        'Ingredient not found'
      );
    }

    return ingredient;
  }

    async update(
    id,
    dto,
    userId,
    session = null
  ) {
    const ingredient =
      await this.findById(id);

    if (
      dto.name &&
      dto.name !== ingredient.name
    ) {
      const duplicate =
        await ingredientRepository.findOne(
          {
            _id: {
              $ne: ingredient._id,
            },
            name: dto.name,
            isDeleted: false,
          },
          {
            session,
            populate: false,
          }
        );

      if (duplicate) {
        throw new ConflictError(
          'Ingredient name already exists'
        );
      }
    }

    if (dto.category) {
      const category =
        await categoryRepository.findById(
          dto.category,
          {
            session,
          }
        );

      if (!category) {
        throw new NotFoundError(
          'Category not found'
        );
      }
    }

    if (dto.unit) {
      const unit =
        await unitRepository.findById(
          dto.unit,
          {
            session,
          }
        );

      if (!unit) {
        throw new NotFoundError(
          'Unit not found'
        );
      }
    }

    // Business Rule:
    // Stock & Average Price hanya boleh diubah
    // melalui Purchase / Stock Adjustment.

    delete dto.currentStock;
    delete dto.averagePrice;

    return ingredientRepository.update(
      {
        _id: id,
        isDeleted: false,
      },
      {
        ...dto,
        updatedBy: userId,
      },
      {
        session,
      }
    );
  }

  async delete(
    id,
    userId,
    session = null
  ) {
    await this.findById(id);

    return ingredientRepository.softDelete(
      {
        _id: id,
        isDeleted: false,
      },
      userId,
      {
        session,
      }
    );
  }
}

export default new IngredientService();