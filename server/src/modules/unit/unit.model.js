import mongoose from 'mongoose';

import { UNIT_STATUS } from './unit.constants.js';

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

const Unit = mongoose.model('Unit', unitSchema);

export default Unit;
