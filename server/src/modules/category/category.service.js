import ConflictError from '#errors/ConflictError';
import ForbiddenError from '#errors/ForbiddenError';
import NotFoundError from '#errors/NotFoundError';

import counterService from '#shared/counter/counter.service';

import categoryRepository from './category.repository.js';

class CategoryService {
  async create(dto, userId, tenantId) {
    const exists = await categoryRepository.findByName(dto.name);

    if (exists) {
      throw new ConflictError('Category name already exists');
    }

    const code = await counterService.generate('category');

    return categoryRepository.create({
      code,
      name: dto.name,
      description: dto.description || '',
      isSystem: !tenantId,
      tenantId: tenantId || null,
      createdBy: userId,
    });
  }

  async findAll(query) {
    const result = await categoryRepository.findAll(query);

    return {
      data: result.items,

      pagination: {
        page: Number(query.page),
        limit: Number(query.limit),
        total: result.total,
        totalPages: Math.ceil(result.total / Number(query.limit)),
      },
    };
  }

  async findById(id) {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async update(id, dto, userId, tenantId) {
    const current = await this.findById(id);
    if (current.isSystem && !tenantId) throw new NotFoundError('Category not found');
    if (current.isSystem && tenantId && !current.tenantId) {
      // system category: tenant tidak boleh ubah global, buat custom copy? simplest block
      throw new ForbiddenError('Kategori system tidak bisa diubah');
    }
    if (current.tenantId && tenantId && current.tenantId.toString() !== tenantId.toString()) throw new NotFoundError('Category not found');

    if (dto.name && dto.name !== current.name) {
      const exists = await categoryRepository.findByName(dto.name);

      if (exists) {
        throw new ConflictError('Category name already exists');
      }
    }

    return categoryRepository.update(id, {
      ...dto,
      updatedBy: userId,
    });
  }

  async delete(id, userId, tenantId) {
    const current = await this.findById(id);
    if (current.isSystem && !current.tenantId) throw new ForbiddenError('Kategori system tidak bisa dihapus');
    if (current.tenantId && tenantId && current.tenantId.toString() !== tenantId.toString()) throw new NotFoundError('Category not found');

    return categoryRepository.softDelete(id, userId);
  }
}

export default new CategoryService();
