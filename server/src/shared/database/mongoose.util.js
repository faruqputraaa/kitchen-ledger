export async function executePagination({ model, filter, options }) {
  const [items, total] = await Promise.all([
    model.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),

    model.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: options.page,
    limit: options.limit,
  };
}
