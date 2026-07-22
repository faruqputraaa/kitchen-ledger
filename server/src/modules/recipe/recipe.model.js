import mongoose from 'mongoose';

import { RECIPE_STATUS } from './recipe.constants.js';

const recipeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: Object.values(RECIPE_STATUS),
      default: RECIPE_STATUS.ACTIVE,
    },

    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

recipeSchema.index({ code: 1 });
recipeSchema.index({ name: 1 });
recipeSchema.index({ status: 1 });
recipeSchema.index({ isDeleted: 1 });

// ======== VIRTUAL items (dari RecipeItem collection) ========
recipeSchema.virtual('items', {
  ref: 'RecipeItem',
  localField: '_id',
  foreignField: 'recipe',
});

// ======== VIRTUAL foodCost (dinamis dari lastPrice) ========
recipeSchema.virtual('foodCost').get(function () {
  if (!this.items || !this.items.length) return 0;
  if (!this.populated('items.ingredient')) return 0;

  return this.items.reduce((sum, item) => {
    const price = item.ingredient?.lastPrice || 0;
    return sum + item.quantity * price;
  }, 0);
});

// Agar virtual muncul di JSON response
recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;