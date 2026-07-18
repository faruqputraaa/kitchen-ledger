import mongoose from 'mongoose';

import { SUPPLIER_STATUS } from './supplier.constants.js';

const supplierSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
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

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier;
