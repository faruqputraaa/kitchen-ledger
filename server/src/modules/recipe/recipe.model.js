import mongoose from 'mongoose';

import { RECIPE_STATUS } from './recipe.constants.js';

const recipeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
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

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
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
recipeSchema.index({ tenantId: 1, code: 1 }, { unique: true });
recipeSchema.index({ tenantId: 1, name: 1 });

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

// Auto-filter by tenantId for all queries
recipeSchema.pre(/^find/, async function () {
  const tenantId = this.getOptions().tenantId;
  if (tenantId) {
    this.where({ tenantId });
  }
});

// Auto-set tenantId on create
recipeSchema.pre('save', async function () {
  if (this.isNew && !this.tenantId) {
    const tenantId = this.getOptions().tenantId;
    if (tenantId) {
      this.tenantId = tenantId;
    }
  }
});

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;