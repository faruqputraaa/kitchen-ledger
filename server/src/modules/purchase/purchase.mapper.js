class PurchaseMapper {
  toResponse(purchase) {
    if (!purchase) return null;

    return {
      id: purchase._id.toString(),
      code: purchase.code,
      supplier: purchase.supplier
        ? {
            id: purchase.supplier._id.toString(),
            name: purchase.supplier.name,
          }
        : null,
      purchaseDate: purchase.purchaseDate,
      status: purchase.status,
      note: purchase.note,
      totalAmount: purchase.totalAmount,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
    };
  }

  toList(purchases) {
    return purchases.map((p) => this.toResponse(p));
  }

    toDetail(purchase) {
    const base = this.toResponse(purchase);
    if (!base) return null;

    const rawItems = purchase.items ?? [];
    return {
      ...base,
      items: rawItems.map((it) => ({
        id: it._id?.toString?.() ?? it.id?.toString?.() ?? null,
        ingredient: it.ingredient?.name
          ? {
              id: it.ingredient._id?.toString() ?? it.ingredient.id,
              code: it.ingredient.code,
              name: it.ingredient.name,
              unit: it.ingredient.unit,
            }
          : (it.ingredient?.toString?.() ?? it.ingredient ?? null),
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
      })),
    };
  }

}

export default new PurchaseMapper();
