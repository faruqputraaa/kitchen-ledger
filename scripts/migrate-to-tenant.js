#!/usr/bin/env node
/**
 * Migration script: Assign existing data to DEFAULT tenant
 * Run: node scripts/migrate-to-tenant.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Tenant from '../server/src/modules/tenant/tenant.model.js';
import User from '../server/src/modules/user/user.model.js';
import Ingredient from '../server/src/modules/ingredient/ingredient.model.js';
import Recipe from '../server/src/modules/recipe/recipe.model.js';
import Purchase from '../server/src/modules/purchase/purchase.model.js';
import Menu from '../server/src/modules/menu/menu.model.js';
import Supplier from '../server/src/modules/supplier/supplier.model.js';
import StockAdjustment from '../server/src/modules/stock-adjustment/stock-adjustment.model.js';
import Category from '../server/src/modules/category/category.model.js';
import Unit from '../server/src/modules/unit/unit.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kitchen-ledger';

async function migrate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    // 1. Create/find DEFAULT tenant
    let tenant = await Tenant.findOne({ code: 'DEFAULT' });
    if (!tenant) {
      tenant = await Tenant.create({
        code: 'DEFAULT',
        name: 'Default Tenant (Testing)',
        status: 'ACTIVE',
        plan: 'FREE',
        settings: {
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
        },
      });
      console.log('✅ Created DEFAULT tenant:', tenant._id);
    } else {
      console.log('✅ Found DEFAULT tenant:', tenant._id);
    }

    const tenantId = tenant._id;

    // 2. Update all models that need tenantId
    const models = [
      { name: 'User', model: User },
      { name: 'Ingredient', model: Ingredient },
      { name: 'Recipe', model: Recipe },
      { name: 'Purchase', model: Purchase },
      { name: 'Menu', model: Menu },
      { name: 'Supplier', model: Supplier },
      { name: 'StockAdjustment', model: StockAdjustment },
    ];

    for (const { name, model } of models) {
      const result = await model.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId } }
      );
      console.log(`✅ ${name}: updated ${result.modifiedCount} documents`);
    }

    // 3. Category & Unit: mark existing as isSystem=true (already default)
    const catResult = await Category.updateMany(
      { isSystem: { $exists: false } },
      { $set: { isSystem: true } }
    );
    console.log(`✅ Category: marked ${catResult.modifiedCount} as system`);

    const unitResult = await Unit.updateMany(
      { isSystem: { $exists: false } },
      { $set: { isSystem: true } }
    );
    console.log(`✅ Unit: marked ${unitResult.modifiedCount} as system`);

    console.log('\n🎉 Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();