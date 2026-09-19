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

ingredientPriceHistorySchema.index({ ingredient: 1, date: -1 });
ingredientPriceHistorySchema.index({ tenantId: 1 });

const IngredientPriceHistory = mongoose.model(
  'IngredientPriceHistory',
  ingredientPriceHistorySchema
);

export default IngredientPriceHistory;
