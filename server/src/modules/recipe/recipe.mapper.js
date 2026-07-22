class RecipeMapper {
  toResponse(recipe) {
    if (!recipe) return null;

    // foodCost: prioritaskan dari items yg sudah di-map (dari findAll/findById)
    // kalau tidak ada, fallback ke virtual getter
    const hasMappedItems = Array.isArray(recipe.items) && recipe.items.length > 0;
    let foodCost = 0;

    if (hasMappedItems) {
      foodCost = recipe.items.reduce((sum, it) => sum + (it.lineCost || 0), 0);
    } else if (typeof recipe.foodCost === 'function') {
      foodCost = recipe.foodCost();
    } else {
      foodCost = recipe.foodCost ?? 0;
    }

    return {
      id: recipe._id?.toString?.() ?? recipe.id,
      code: recipe.code,
      name: recipe.name,
      description: recipe.description,
      status: recipe.status,
      foodCost,
      note: recipe.note,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };
  }

  toList(recipes) {
    return recipes.map((r) => this.toResponse(r));
  }

  toDetail(recipe) {
    const base = this.toResponse(recipe);
    if (!base) return null;

    return {
      ...base,
      items:
        recipe.items?.map((it) => ({
          id: it.id?.toString?.() ?? null,
          ingredient: it.ingredient,
          quantity: it.quantity,
          lineCost: it.lineCost,
        })) ?? [],
    };
  }
}

export default new RecipeMapper();