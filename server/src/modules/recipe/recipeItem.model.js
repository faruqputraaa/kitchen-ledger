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

    // unit yang dipakai di resep (boleh beda dari unit ingredient)
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const RecipeItem = mongoose.model(
  'RecipeItem',
  recipeItemSchema
);

export default RecipeItem;
