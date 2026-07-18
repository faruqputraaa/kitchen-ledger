class CategoryMapper {
  toResponse(category) {
    if (!category) {
      return null;
    }

    return {
      id: category._id.toString(),

      code: category.code,

      name: category.name,

      description:
        category.description,

      status: category.status,

      createdAt:
        category.createdAt,

      updatedAt:
        category.updatedAt,
    };
  }

  toList(categories) {
    return categories.map((item) =>
      this.toResponse(item)
    );
  }
}

export default new CategoryMapper();