class IngredientMapper {
  toResponse(ingredient) {
    return {
      id: ingredient._id,

      code: ingredient.code,

      name: ingredient.name,

    category: ingredient.category
        ? {
            id: ingredient.category._id,
            code: ingredient.category.code,
            name: ingredient.category.name,
        }
        : null,

    unit: ingredient.unit
        ? {
            id: ingredient.unit._id,
            code: ingredient.unit.code,
            name: ingredient.unit.name,
            symbol: ingredient.unit.symbol,
        }
        : null,

      minimumStock: ingredient.minimumStock,

      currentStock: ingredient.currentStock,

      averagePrice: ingredient.averagePrice,

      notes: ingredient.notes,

      status: ingredient.status,

      createdAt: ingredient.createdAt,

      updatedAt: ingredient.updatedAt,
    };
  }

  toList(ingredients) {
    return ingredients.map((ingredient) =>
      this.toResponse(ingredient)
    );
  }
}

export default new IngredientMapper();