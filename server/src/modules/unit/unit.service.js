import ConflictError from '#errors/ConflictError';
import NotFoundError from '#errors/NotFoundError';

import counterService from '#shared/counter/counter.service';

import unitRepository from './unit.repository.js';

class UnitService {
  async create(dto, userId) {
    const duplicate =
      await unitRepository.findOne({
        isDeleted: false,
        $or: [
          { name: dto.name },
          { symbol: dto.symbol },
        ],
      });

    if (duplicate) {
      throw new ConflictError(
        duplicate.name === dto.name
          ? 'Unit name already exists'
          : 'Unit symbol already exists'
      );
    }

    const code =
      await counterService.generate(
        'unit'
      );

    return unitRepository.create({
      code,
      ...dto,
      createdBy: userId,
    });
  }

  async findAll(query) {
    const result =
      await unitRepository.findAll(query);

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
    const unit =
      await unitRepository.findById(id);

    if (!unit) {
      throw new NotFoundError(
        'Unit not found'
      );
    }

    return unit;
  }

  async update(id, dto, userId) {
    const current =
      await this.findById(id);

    if (
      dto.name ||
      dto.symbol
    ) {
      const duplicate =
        await unitRepository.findOne({
          _id: { $ne: current._id },
          isDeleted: false,
          $or: [
            { name: dto.name },
            { symbol: dto.symbol },
          ],
        });

      if (duplicate) {
        throw new ConflictError(
          duplicate.name === dto.name
            ? 'Unit name already exists'
            : 'Unit symbol already exists'
        );
      }
    }

    return unitRepository.update(id, {
      ...dto,
      updatedBy: userId,
    });
  }

  async delete(id, userId) {
    await this.findById(id);

    return unitRepository.softDelete(
      id,
      userId
    );
  }
}

export default new UnitService();