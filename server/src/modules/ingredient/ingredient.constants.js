export const INGREDIENT_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

export const INGREDIENT_SORT_FIELDS = Object.freeze([
  'name',
  'code',
  'currentStock',
  'minimumStock',
  'averagePrice',
  'createdAt',
  'updatedAt',
]);

export const INGREDIENT_SEARCH_FIELDS = Object.freeze(['name', 'code']);

export const INGREDIENT_POPULATE = Object.freeze([
  {
    path: 'category',
    select: 'code name',
  },
  {
    path: 'unit',
    select: 'code name symbol',
  },
]);
