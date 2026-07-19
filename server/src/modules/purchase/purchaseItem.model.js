import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      index: true,
    },

    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPrice: {
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

const PurchaseItem = mongoose.model(
  'PurchaseItem',
  purchaseItemSchema
);

export default PurchaseItem;