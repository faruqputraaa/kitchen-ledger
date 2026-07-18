import { buildPagination } from './pagination.util.js';
import { buildSort } from './sort.util.js';

export function buildQueryOptions({ query, allowedSort = [] }) {
  const pagination = buildPagination(query);

  const sort = buildSort(query, allowedSort);

  return {
    ...pagination,
    sort,
  };
}
