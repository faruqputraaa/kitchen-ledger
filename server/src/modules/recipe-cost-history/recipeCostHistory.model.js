import mongoose from 'mongoose';

const recipeCostHistorySchema = new mongoose.Schema(
  {
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    foodCost: {
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

recipeCostHistorySchema.index({ recipe: 1, date: -1 }); // Untuk query histori

const RecipeCostHistory = mongoose.model(
  'RecipeCostHistory',
  recipeCostHistorySchema
);

export default RecipeCostHistory;