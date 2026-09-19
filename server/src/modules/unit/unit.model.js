import mongoose from 'mongoose';

import { UNIT_STATUS, UNIT_DIMENSION } from './unit.constants.js';

const unitSchema = new mongoose.Schema(
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
      maxlength: 100,
    },

    symbol: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 20,
    },

    dimension: {
      type: String,
      enum: Object.values(UNIT_DIMENSION),
      required: true,
    },

    baseFactor: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: Object.values(UNIT_STATUS),
      default: UNIT_STATUS.ACTIVE,
      index: true,
    },

    isSystem: {
      type: Boolean,
      default: true,
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null,
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

unitSchema.index({
  isDeleted: 1,
  status: 1,
});
unitSchema.index({ tenantId: 1, code: 1 }, { unique: true, partialFilterExpression: { tenantId: { $exists: true, $ne: null } } });
unitSchema.index({ tenantId: 1, name: 1 });

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;
