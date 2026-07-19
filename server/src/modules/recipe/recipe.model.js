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

    foodCost: {
      type: Number,
      default: 0,
      min: 0,
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

const Recipe = mongoose.model(
  'Recipe',
  recipeSchema
);

export default Recipe;
