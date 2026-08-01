import NotFoundError from '#shared/errors/NotFoundError';
import ValidationError from '#shared/errors/ValidationError';
import counterService from '#shared/counter/counter.service';
import stockAdjustmentRepository from './stock-adjustment.repository.js';
import ingredientRepository from '../ingredient/ingredient.repository.js';

class StockAdjustmentService {
  async create(dto, userId) {
    const ingredient = await ingredientRepository.findById(dto.ingredient);
    if (!ingredient) throw new NotFoundError('Ingredient not found');

    const stockBefore = ingredient.currentStock;
    const stockAfter = stockBefore - dto.quantity; // Always OUT

    if (stockAfter < 0) throw new ValidationError('Stock tidak boleh negatif');

    const code = await counterService.generate('stock-adjustment');

    // Update ingredient stock (only decrease)
    await ingredientRepository.update(
      { _id: ingredient._id },
      { currentStock: stockAfter, updatedBy: userId }
    );

    // Create adjustment record
    return stockAdjustmentRepository.create({
      code,
      ingredient: ingredient._id,
      type: 'OUT',
      reason: dto.reason,
      quantity: dto.quantity,
      adjustmentDate: dto.adjustmentDate ?? new Date(),
      notes: dto.notes ?? '',
      stockBefore,
      stockAfter,
      createdBy: userId,
    });
  }

  async findAll(query) {
    const result = await stockAdjustmentRepository.findMany(query);
    return {
      data: result.items,
      pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: Math.ceil(result.total / result.limit) },
    };
  }
}

export default new StockAdjustmentService();