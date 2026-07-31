export const MENU_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
});

export const MENU_SORT_FIELDS = Object.freeze([
  'code',
  'name',
  'sellingPrice',
  'foodCost',
  'margin',
  'createdAt',
  'updatedAt',
]);

export const MENU_SEARCH_FIELDS = Object.freeze([
  'code',
  'name',
  'description',
]);

export const MENU_POPULATE = Object.freeze([
  {
    path: 'recipe',
    select: 'code name foodCost',
    populate: {
      path: 'items',
      populate: {
        path: 'ingredient',
        select: 'code name lastPrice unit',
      },
    },
  },
  {
    path: 'createdBy',
    select: 'code name',
  },
]);