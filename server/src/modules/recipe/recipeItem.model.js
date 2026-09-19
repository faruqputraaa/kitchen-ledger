import mongoose from 'mongoose';

const recipeItemSchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
      index: true,
    },
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

recipeItemSchema.index({ tenantId: 1 });

const RecipeItem = mongoose.model(
  'RecipeItem',
  recipeItemSchema
);

export default RecipeItem;
