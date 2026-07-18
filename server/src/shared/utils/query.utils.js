export function buildPagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function buildSort(query, allowedFields = []) {
  const sortField = allowedFields.includes(query.sort) ? query.sort : 'createdAt';

  return {
    [sortField]: query.order === 'asc' ? 1 : -1,
  };
}

export function buildSearch(search, fields = []) {
  if (!search) return {};

  return {
    $or: fields.map((field) => ({
      [field]: {
        $regex: search,
        $options: 'i',
      },
    })),
  };
}
