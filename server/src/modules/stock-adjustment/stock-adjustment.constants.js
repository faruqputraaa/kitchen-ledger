export const STOCK_ADJUSTMENT_REASON = Object.freeze({
  WASTE: 'WASTE',
  TRANSFER: 'TRANSFER',
  CORRECTION: 'CORRECTION',
  OTHER: 'OTHER',
});

export const STOCK_ADJUSTMENT_SORT_FIELDS = Object.freeze([
  'code', 'adjustmentDate', 'createdAt',
]);

export const STOCK_ADJUSTMENT_SEARCH_FIELDS = Object.freeze([
  'code', 'reason', 'notes',
]);

export const STOCK_ADJUSTMENT_POPULATE = Object.freeze([
  {
    path: 'ingredient',
    select: 'code name currentStock unit lastPrice',
    populate: { path: 'unit', select: 'code name symbol' },
  },
  {
    path: 'createdBy',
    select: 'code name',
  },
]);