export function buildSearch(keyword, fields = []) {
  if (!keyword) {
    return {};
  }

  return {
    $or: fields.map((field) => ({
      [field]: {
        $regex: keyword,
        $options: 'i',
      },
    })),
  };
}
