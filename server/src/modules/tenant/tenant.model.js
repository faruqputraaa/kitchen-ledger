import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    inviteCodeExpiresAt: {
      type: Date,
      default: null,
    },
    logo: {
      type: String,
      default: null,
    },
    settings: {
      currency: { type: String, default: 'IDR' },
      timezone: { type: String, default: 'Asia/Jakarta' },
      features: [String],
    },
    plan: {
      type: String,
      enum: ['FREE', 'PRO', 'ENTERPRISE'],
      default: 'FREE',
    },
    limits: {
      maxUsers: { type: Number, default: 10 },
      maxIngredients: { type: Number, default: 1000 },
      maxRecipes: { type: Number, default: 500 },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'TRIAL'],
      default: 'TRIAL',
    },
    trialEndsAt: Date,
  },
  { timestamps: true, versionKey: false }
);

tenantSchema.index({ code: 1 });
tenantSchema.index({ domain: 1 });
tenantSchema.index({ inviteCode: 1 });
tenantSchema.index({ status: 1 });

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;