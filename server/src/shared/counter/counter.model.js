import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    prefix: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    sequence: {
      type: Number,
      default: 0,
      min: 0,
    },

    padding: {
      type: Number,
      default: 6,
    },

    isDateBased: {
      type: Boolean,
      default: false,
    },

    resetPolicy: {
      type: String,
      enum: ['NEVER', 'YEARLY', 'MONTHLY'],
      default: 'NEVER',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

counterSchema.index({ module: 1 }, { unique: true });

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
