import mongoose from 'mongoose';

import { PURCHASE_STATUS } from './purchase.constants.js';

const purchaseSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(PURCHASE_STATUS),
      default: PURCHASE_STATUS.COMPLETED,
    },

    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
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

purchaseSchema.index({ code: 1 });
purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ purchaseDate: 1 });
purchaseSchema.index({ isDeleted: 1 });
purchaseSchema.index({ tenantId: 1, code: 1 }, { unique: true });

// Auto-filter by tenantId for all queries
purchaseSchema.pre(/^find/, async function () {
  const tenantId = this.getOptions().tenantId;
  if (tenantId) {
    this.where({ tenantId });
  }
});

// Auto-set tenantId on create
purchaseSchema.pre('save', async function () {
  if (this.isNew && !this.tenantId) {
    const tenantId = this.getOptions().tenantId;
    if (tenantId) {
      this.tenantId = tenantId;
    }
  }
});

const Purchase = mongoose.model(
  'Purchase',
  purchaseSchema
);

export default Purchase;
