import mongoose from 'mongoose';

import { MENU_STATUS } from './menu.constants.js';

const menuSchema = new mongoose.Schema(
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

    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Virtual foodCost (from recipe.virtual foodCost)
    // Virtual margin = sellingPrice - foodCost
    // Virtual marginPct = margin / sellingPrice * 100

    status: {
      type: String,
      enum: Object.values(MENU_STATUS),
      default: MENU_STATUS.ACTIVE,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Virtual foodCost from recipe
menuSchema.virtual('foodCost').get(function () {
  return this.recipe?.foodCost ?? 0;
});

menuSchema.virtual('margin').get(function () {
  return (this.sellingPrice ?? 0) - (this.recipe?.foodCost ?? 0);
});

menuSchema.virtual('marginPct').get(function () {
  const sp = this.sellingPrice ?? 0;
  const fc = this.recipe?.foodCost ?? 0;
  return sp > 0 ? ((sp - fc) / sp) * 100 : 0;
});

menuSchema.set('toJSON', { virtuals: true });
menuSchema.set('toObject', { virtuals: true });

menuSchema.index({ code: 1 });
menuSchema.index({ name: 1 });
menuSchema.index({ recipe: 1 });
menuSchema.index({ status: 1 });
menuSchema.index({ isDeleted: 1 });

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;