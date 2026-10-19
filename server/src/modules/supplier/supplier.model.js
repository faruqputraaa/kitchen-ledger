import mongoose from 'mongoose';

import { SUPPLIER_STATUS } from './supplier.constants.js';

const supplierSchema = new mongoose.Schema(
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
      maxlength: 150,
    },

    contactPerson: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },

    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 30,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      maxlength: 255,
    },

    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },

    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: 1000,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(SUPPLIER_STATUS),
      default: SUPPLIER_STATUS.ACTIVE,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
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

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    updatedBy: {
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

supplierSchema.index({
  isDeleted: 1,
  status: 1,
});
supplierSchema.index({ tenantId: 1, code: 1 }, { unique: true });
supplierSchema.index({ tenantId: 1, name: 1 });

// Auto-filter by tenantId for all queries
supplierSchema.pre(/^find/, async function () {
  const tenantId = this.getOptions().tenantId;
  if (tenantId) {
    this.where({ tenantId });
  }
});

// Auto-set tenantId on create
supplierSchema.pre('save', async function () {
  if (this.isNew && !this.tenantId) {
    const tenantId = this.getOptions().tenantId;
    if (tenantId) {
      this.tenantId = tenantId;
    }
  }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
