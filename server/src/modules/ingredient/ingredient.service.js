import NotFoundError from '#shared/errors/NotFoundError';
import ValidationError from '#shared/errors/ValidationError';

import ingredientRepository from './ingredient.repository.js';
import { ingredientPriceHistoryRepository } from '../ingredient-price-history/index.js';
import counterService from '#shared/counter/counter.service';

class IngredientService {
  async create(dto, userId) {
    const code = await counterService.generate('ingredient');

    const ingredient = await ingredientRepository.create({
      code,
      name: dto.name,
      category: dto.category,
      unit: dto.unit,
      minimumStock: dto.minimumStock ?? 0,
      currentStock: dto.currentStock ?? 0,
      lastPrice: dto.lastPrice ?? 0,
      lastPurchaseDate: null,
      status: dto.status ?? 'ACTIVE',
      notes: dto.notes ?? '',
      createdBy: userId,
    });

    return ingredient;
  }

  async findAll(query) {
    const result = await ingredientRepository.findMany(query);

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
    const ingredient =
      await ingredientRepository.findById(id);

    if (!ingredient) {
      throw new NotFoundError('Ingredient not found');
    }

    return ingredient;
  }

  async update(id, dto, userId) {
    const existing = await this.findById(id);

    const patch = { updatedBy: userId };

    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.category !== undefined)
      patch.category = dto.category;
    if (dto.unit !== undefined) patch.unit = dto.unit;
    if (dto.minimumStock !== undefined)
      patch.minimumStock = dto.minimumStock;
    if (dto.currentStock !== undefined)
      patch.currentStock = dto.currentStock;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.notes !== undefined) patch.notes = dto.notes;
    if (dto.lastPrice !== undefined)
      patch.lastPrice = dto.lastPrice;

    return ingredientRepository.update(
      existing._id,
      patch
    );
  }

  async delete(id, userId) {
    const ingredient = await this.findById(id);

    return ingredientRepository.softDelete(
      ingredient._id,
      userId
    );
  }

  async searchIngredients(query) {
    return this.findAll(query);
  }

  // Dipanggil dari Purchase (status COMPLETED)
  async applyStockIncrease(
    ingredientId,
    quantity,
    unitPrice,
    purchaseId,
    session = null
  ) {
    const ingredient = await ingredientRepository.findById(
      ingredientId,
      { session }
    );

    if (!ingredient) {
      throw new NotFoundError(
        `Ingredient ${ingredientId} not found`
      );
    }

    // Update currentStock dan lastPrice
    const newStock = ingredient.currentStock + quantity;

    const patch = {
      currentStock: newStock,
      lastPrice: unitPrice,
      lastPurchaseDate: new Date(),
      lastPurchaseId: purchaseId,
    };

    await ingredientRepository.update(
      { _id: ingredientId },
      patch,
      { session }
    );

    // Simpan histori harga ke collection terpisah
    await ingredientPriceHistoryRepository.create(
      {
        ingredient: ingredientId,
        date: new Date(),
        lastPrice: unitPrice,
        purchaseId: purchaseId,
      },
      session
    );

    return {
      ingredientId,
      previousStock: ingredient.currentStock,
      addedQuantity: quantity,
      newStock,
      lastPrice: unitPrice,
    };
  }
}

export default new IngredientService();