class MenuMapper {
  toResponse(menu) {
    if (!menu) return null;

    // Compute foodCost from populated recipe.items with unit conversion
    // (recipe virtual foodCost doesn't do unit conversion)
    const computeFoodCost = (recipe) => {
      if (!recipe?.items?.length) return 0;
      return recipe.items.reduce((sum, item) => {
        const price = item.ingredient?.lastPrice || 0;
        if (price === 0) return sum;

        const recipeUnit = item.unit; // unit used in recipe
        const ingredientUnit = item.ingredient?.unit; // ingredient's base unit
        if (!recipeUnit || !ingredientUnit) return sum;

        // qty in ingredient's base unit = qty * (recipeUnit.baseFactor / ingredientUnit.baseFactor)
        const qtyInIngredientUnit = (item.quantity || 0) *
          (recipeUnit.baseFactor || 1) / (ingredientUnit.baseFactor || 1);

        return sum + qtyInIngredientUnit * price;
      }, 0);
    };

    const foodCost = computeFoodCost(menu.recipe);
    const sellingPrice = menu.sellingPrice ?? 0;
    const margin = sellingPrice - foodCost;
    const marginPct = sellingPrice > 0 ? (margin / sellingPrice) * 100 : 0;

    return {
      id: menu._id?.toString?.() ?? menu.id,
      code: menu.code,
      name: menu.name,
      description: menu.description,
      recipe: menu.recipe ? {
        id: menu.recipe._id?.toString?.() ?? menu.recipe.id,
        code: menu.recipe.code,
        name: menu.recipe.name,
        foodCost,
      } : menu.recipe,
      sellingPrice,
      foodCost,
      margin,
      marginPct,
      status: menu.status,
      createdAt: menu.createdAt,
      updatedAt: menu.updatedAt,
    };
  }

  toList(menus) {
    return menus.map((m) => this.toResponse(m));
  }

  toDetail(menu) {
    return this.toResponse(menu);
  }
}

export default new MenuMapper();