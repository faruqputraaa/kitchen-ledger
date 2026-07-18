import {
  DEFAULT_ORDER,
  DEFAULT_SORT,
} from '../constants/sort.js';

export function buildSort(
  query,
  allowed = []
) {
  const field = allowed.includes(
    query.sort
  )
    ? query.sort
    : DEFAULT_SORT;

  return {
    [field]:
      query.order === 'asc'
        ? 1
        : DEFAULT_ORDER === 'desc'
        ? -1
        : 1,
  };
}