import ConflictError from '#shared/errors/ConflictError';
import NotFoundError from '#shared/errors/NotFoundError';
import ValidationError from '#shared/errors/ValidationError';

import withTransaction from '#shared/database/transaction';
import counterService from '#shared/counter/counter.service';

import purchaseRepository, {
  purchaseItemRepository,
} from './purchase.repository.js';
import ingredientService from '../ingredient/ingredient.service.js';

class PurchaseService {
  async create(dto, userId) {
    return withTransaction(async (session) => {
      const code = await counterService.generate(
        'purchase',
        session
      );

      let totalAmount = 0;

      const items = dto.items.map((item) => {
        const totalPrice =
          Math.round(
            item.quantity * item.unitPrice * 100
          ) / 100;

        totalAmount += totalPrice;

        return {
          purchase: null,
          ingredient: item.ingredient,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice,
        };
      });

      totalAmount =
        Math.round(totalAmount * 100) / 100;

      const purchase = await purchaseRepository.create(
        {
          code,
          supplier: dto.supplier ?? null,
          purchaseDate: dto.purchaseDate ?? new Date(),
          status: dto.status ?? 'COMPLETED',
          note: dto.note ?? '',
          totalAmount,
          createdBy: userId,
        },
        session
      );

      const itemsWithRef = items.map((it) => ({
        ...it,
        purchase: purchase._id,
      }));

      await purchaseItemRepository.createMany(
        itemsWithRef,
        session
      );

      if (purchase.status === 'COMPLETED') {
        for (const it of dto.items) {
          await ingredientService.applyStockIncrease(
            it.ingredient,
            it.quantity,
            it.unitPrice,
            session
          );
        }
      }

      const created = await purchaseRepository.findById(
        purchase._id,
        { session }
      );

      const purchaseItems = await purchaseItemRepository.findByPurchase(
        purchase._id,
        session
      );

      return {
        ...created.toObject(),
        items: purchaseItems.map((it) => ({
          id: it._id.toString(),
          ingredient: it.ingredient.toString(),
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
        })),
      };
    });
  }

  async findAll(query) {
    const result = await purchaseRepository.findMany(query);

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
    const purchase = await purchaseRepository.findById(id);

    if (!purchase) {
      throw new NotFoundError('Purchase not found');
    }

    const items = await purchaseItemRepository.findByPurchase(
      purchase._id
    );

    return {
      ...purchase.toObject(),
      items,
    };
  }

  async delete(id, userId) {
    const purchase = await this.findById(id);

    return purchaseRepository.softDelete(
      { _id: id, isDeleted: false },
      userId
    );
  }
}

export default new PurchaseService();
