import mongoose from 'mongoose';

const ingredientPriceHistorySchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    lastPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ingredientPriceHistorySchema.index({ ingredient: 1, date: -1 }); // Untuk query histori terbaru

const IngredientPriceHistory = mongoose.model(
  'IngredientPriceHistory',
  ingredientPriceHistorySchema
);

export default IngredientPriceHistory;
