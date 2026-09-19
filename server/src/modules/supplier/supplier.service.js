import ConflictError from '#errors/ConflictError';
import NotFoundError from '#errors/NotFoundError';

import counterService from '#shared/counter/counter.service';

import supplierRepository from './supplier.repository.js';

class SupplierService {
  async create(dto, userId, tenantId, session = null) {
    const duplicate = await supplierRepository.findOne(
      {
        name: dto.name,
        tenantId,
        isDeleted: false,
      },
      {
        session,
      }
    );

    if (duplicate) {
      throw new ConflictError('Supplier name already exists');
    }

    const code = await counterService.generate('supplier', tenantId, session);

    return supplierRepository.create(
      {
        code,
        name: dto.name,
        contactPerson: dto.contactPerson ?? '',
        phone: dto.phone ?? '',
        email: dto.email ?? '',
        address: dto.address ?? '',
        notes: dto.notes ?? '',
        tenantId,
        createdBy: userId,
      },
      session
    );
  }

  async findAll(query) {
    const result = await supplierRepository.findMany(query);

    return {
      data: result.items,

      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async findById(id, tenantId) {
    const supplier = await supplierRepository.findById(id);

    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }
    if (tenantId && supplier.tenantId && supplier.tenantId.toString() !== tenantId.toString()) throw new NotFoundError('Supplier not found');

    return supplier;
  }

  async update(id, dto, userId, tenantId, session = null) {
    const supplier = await this.findById(id, tenantId);

    if (dto.name && dto.name !== supplier.name) {
      const duplicate = await supplierRepository.findOne(
        {
          _id: {
            $ne: supplier._id,
          },
          name: dto.name,
          isDeleted: false,
        },
        {
          session,
        }
      );

      if (duplicate) {
        throw new ConflictError('Supplier name already exists');
      }
    }

    return supplierRepository.update(
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

  async delete(id, userId, tenantId, session = null) {
    await this.findById(id);

    return supplierRepository.softDelete(
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

export default new SupplierService();
