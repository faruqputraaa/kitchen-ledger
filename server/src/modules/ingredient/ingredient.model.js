import mongoose from 'mongoose';

import { INGREDIENT_STATUS } from './ingredient.constants.js';

const ingredientSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },

    minimumStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    averagePrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: Object.values(INGREDIENT_STATUS),
      default: INGREDIENT_STATUS.ACTIVE,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    deletedBy: {
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
  },
  {
    timestamps: true,
  }
);

ingredientSchema.index(
  {
    name: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  }
);

ingredientSchema.index({
  category: 1,
});

ingredientSchema.index({
  unit: 1,
});

ingredientSchema.index({
  status: 1,
});

export default mongoose.model('Ingredient', ingredientSchema);
