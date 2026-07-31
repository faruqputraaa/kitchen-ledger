class MenuMapper {
  toResponse(menu) {
    if (!menu) return null;

    return {
      id: menu._id?.toString?.() ?? menu.id,
      code: menu.code,
      name: menu.name,
      description: menu.description,
      recipe: menu.recipe ? {
        id: menu.recipe._id?.toString?.() ?? menu.recipe.id,
        code: menu.recipe.code,
        name: menu.recipe.name,
        foodCost: menu.recipe.foodCost ?? 0,
      } : menu.recipe,
      sellingPrice: menu.sellingPrice,
      foodCost: menu.foodCost ?? 0,
      margin: menu.margin ?? 0,
      marginPct: menu.marginPct ?? 0,
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