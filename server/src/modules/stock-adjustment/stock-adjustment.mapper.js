class StockAdjustmentMapper {
  toResponse(doc) {
    if (!doc) return null;
    return {
      id: doc._id?.toString?.() ?? doc.id,
      code: doc.code,
      ingredient: doc.ingredient?._id
        ? { id: doc.ingredient._id.toString(), code: doc.ingredient.code, name: doc.ingredient.name, unit: doc.ingredient.unit }
        : doc.ingredient,
      type: doc.type,
      reason: doc.reason,
      quantity: doc.quantity,
      adjustmentDate: doc.adjustmentDate,
      notes: doc.notes,
      stockBefore: doc.stockBefore,
      stockAfter: doc.stockAfter,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  toList(docs) { return docs.map(d => this.toResponse(d)); }
}

export default new StockAdjustmentMapper();