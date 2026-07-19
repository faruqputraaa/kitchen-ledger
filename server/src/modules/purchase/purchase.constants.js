export const PURCHASE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export const PURCHASE_SORT_FIELDS = Object.freeze([
  'code',
  'purchaseDate',
  'totalAmount',
  'createdAt',
  'updatedAt',
]);

export const PURCHASE_SEARCH_FIELDS = Object.freeze([
  'code',
  'note',
]);

export const PURCHASE_POPULATE = Object.freeze([
  {
    path: 'supplier',
    select: 'code name',
  },
]);