import mongoose from 'mongoose';

import { INGREDIENT_STATUS } from './ingredient.constants.js';

const ingredientSchema = new mongoose.Schema(
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

    // ======== PERUBAHAN DISINI ========
    lastPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },
    lastPurchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null,
    },
    // ==================================

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(INGREDIENT_STATUS),
      default: INGREDIENT_STATUS.ACTIVE,
    },

    notes: {
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

ingredientSchema.index({ code: 1 });
ingredientSchema.index({ name: 1 });
ingredientSchema.index({ category: 1 });
ingredientSchema.index({ status: 1 });
ingredientSchema.index({ isDeleted: 1 });
ingredientSchema.index({ tenantId: 1, code: 1 }, { unique: true });
ingredientSchema.index({ tenantId: 1, name: 1 });

// Auto-filter by tenantId for all queries
ingredientSchema.pre(/^find/, async function () {
  const tenantId = this.getOptions().tenantId;
  if (tenantId) {
    this.where({ tenantId });
  }
});

// Auto-set tenantId on create
ingredientSchema.pre('save', async function () {
  if (this.isNew && !this.tenantId) {
    const tenantId = this.getOptions().tenantId;
    if (tenantId) {
      this.tenantId = tenantId;
    }
  }
});

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

export default Ingredient;
