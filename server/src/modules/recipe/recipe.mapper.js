class RecipeMapper {
  toResponse(recipe) {
    if (!recipe) return null;

    return {
      id: recipe._id.toString(),
      code: recipe.code,
      name: recipe.name,
      description: recipe.description,
      status: recipe.status,
      foodCost: recipe.foodCost,
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