import mongoose from 'mongoose';
import { STOCK_ADJUSTMENT_REASON } from './stock-adjustment.constants.js';

const stockAdjustmentSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    ingredient: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    type: { type: String, enum: ['OUT'], default: 'OUT' },
    reason: { type: String, enum: Object.values(STOCK_ADJUSTMENT_REASON), required: true },
    quantity: { type: Number, required: true, min: 0 },
    adjustmentDate: { type: Date, default: Date.now },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
    stockBefore: { type: Number, default: 0 },
    stockAfter: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, versionKey: false }
);

stockAdjustmentSchema.index({ code: 1 });
stockAdjustmentSchema.index({ ingredient: 1 });
stockAdjustmentSchema.index({ adjustmentDate: -1 });
stockAdjustmentSchema.index({ isDeleted: 1 });

const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);
export default StockAdjustment;