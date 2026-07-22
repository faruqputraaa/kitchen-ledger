class IngredientMapper {
  toResponse(ingredient) {
    if (!ingredient) {
      return null;
    }

    return {
      id: ingredient._id.toString(),

      code: ingredient.code,

      name: ingredient.name,

      category: ingredient.category
        ? {
            id: ingredient.category._id.toString(),
            code: ingredient.category.code,
            name: ingredient.category.name,
          }
        : null,

      unit: ingredient.unit
        ? {
            id: ingredient.unit._id.toString(),
            code: ingredient.unit.code,
            name: ingredient.unit.name,
            symbol: ingredient.unit.symbol,
          }
        : null,

      minimumStock: ingredient.minimumStock,

      currentStock: ingredient.currentStock,

      lastPrice: ingredient.lastPrice,
      lastPurchaseDate: ingredient.lastPurchaseDate,
      lastPurchaseId: ingredient.lastPurchaseId,

      notes: ingredient.notes,

      status: ingredient.status,

      createdAt: ingredient.createdAt,

      updatedAt: ingredient.updatedAt,
    };
  }

  toList(ingredients) {
    return ingredients.map((ingredient) => this.toResponse(ingredient));
  }
}

export default new IngredientMapper();