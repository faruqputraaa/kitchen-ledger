export const RECIPE_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

export const RECIPE_SORT_FIELDS = Object.freeze([
  'code',
  'name',
  'createdAt',
  'updatedAt',
]);

export const RECIPE_SEARCH_FIELDS = Object.freeze([
  'code',
  'name',
  'note',
]);

export const RECIPE_POPULATE = Object.freeze([
  {
    path: 'createdBy',
    select: 'code name',
  },
]);
