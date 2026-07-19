export async function executePagination({
  model,
  filter,
  options,
  populate = null,
}) {
  let query = model
    .find(filter)
    .sort(options.sort)
    .skip(options.skip)
    .limit(options.limit);

  if (populate) {
    query = query.populate(populate);
  }

  const [items, total] = await Promise.all([
    query,
    model.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page: options.page,
    limit: options.limit,
  };
}
