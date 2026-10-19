#!/usr/bin/env node
/**
 * Migration script: Assign existing data to DEFAULT tenant
 * Run: node scripts/migrate-to-tenant.js
 *
 * 1. Creates/finds DEFAULT tenant (code: 'DEFAULT')
 * 2. Backfills all tenant-scoped documents to DEFAULT tenant
 * 3. Marks Category/Unit as isSystem: true
 * 4. Drops legacy global unique indexes (code_1, module_1, etc.)
 *    while keeping users.email and tenants.* uniques intact
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
import Counter from '../server/src/shared/counter/counter.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kitchen-ledger';

// Collections whose legacy global single-field unique indexes must be dropped.
// Only the compound {tenantId, code}/{tenantId, name} indexes survive.
const COLLECTION_INDEX_DROPS = {
  ingredients: ['code_1', 'name_1'],
  recipes: ['code_1', 'name_1'],
  purchases: ['code_1'],
  menus: ['code_1', 'name_1'],
  suppliers: ['code_1', 'name_1'],
  categories: ['code_1', 'name_1'],
  units: ['code_1', 'name_1'],
  counters: ['module_1'],
};

// Collections to backfill with DEFAULT tenantId (missing tenantId only)
const BACKFILL_COLLECTIONS = [
  { name: 'User', model: User },
  { name: 'Ingredient', model: Ingredient },
  { name: 'Recipe', model: Recipe },
  { name: 'Purchase', model: Purchase },
  { name: 'Menu', model: Menu },
  { name: 'Supplier', model: Supplier },
  { name: 'StockAdjustment', model: StockAdjustment },
];

async function dropLegacyGlobalUniques(db) {
  console.log('\n🧹 Dropping legacy global unique indexes...');

  for (const [collectionName, indexNames] of Object.entries(COLLECTION_INDEX_DROPS)) {
    const collection = db.collection(collectionName);
    const existing = await collection.indexes();

    for (const indexName of indexNames) {
      const hasIndex = existing.some((i) => i.name === indexName);
      if (!hasIndex) {
        console.log(`   ⏭️  ${collectionName}.${indexName} — not present, skipping`);
        continue;
      }

      const indexInfo = existing.find((i) => i.name === indexName);
      const isUnique = indexInfo && indexInfo.unique === true;
      const isSingleField =
        indexInfo && Object.keys(indexInfo.key || {}).length === 1 && !indexInfo.key._id;

      if (isUnique && isSingleField) {
        await collection.dropIndex(indexName);
        console.log(`   ✅ Dropped ${collectionName}.${indexName} (legacy global unique)`);
      } else {
        console.log(
          `   ⏭️  ${collectionName}.${indexName} — not a single-field unique, keeping`
        );
      }
    }
  }

  console.log('   ✅ Legacy global unique index cleanup done');
}

async function verifyUsersEmailAndTenantsUnique(db) {
  console.log('\n🔐 Verifying load-bearing global uniques are preserved...');

  const usersIndexes = await db.collection('users').indexes();
  const emailUnique = usersIndexes.some(
    (i) => i.unique && i.name === 'email_1'
  );
  console.log(`   users.email_1 unique: ${emailUnique ? 'PRESERVED ✅' : 'MISSING ⚠️'}`);

  const tenantsIndexes = await db.collection('tenants').indexes();
  const tenantsUniques = tenantsIndexes
    .filter((i) => i.unique && i.name !== '_id_')
    .map((i) => i.name);
  console.log(`   tenants.* unique indexes preserved: ${tenantsUniques.join(', ') || 'none'}`);
}

async function verifyNoLegacySingleFieldUniques(db) {
  console.log('\n🔍 Verifying no legacy single-field unique indexes remain on tenant-scoped collections...');

  let violations = 0;
  for (const collectionName of Object.keys(COLLECTION_INDEX_DROPS)) {
    const indexes = await db.collection(collectionName).indexes();
    const bad = indexes.filter(
      (i) => i.unique && Object.keys(i.key || {}).length === 1 && !i.key._id
    );
    if (bad.length) {
      violations += bad.length;
      console.log(`   ❌ ${collectionName}: ${bad.map((b) => b.name).join(', ')}`);
    } else {
      console.log(`   ✅ ${collectionName}: clean`);
    }
  }

  return violations;
}

async function migrate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const db = mongoose.connection.db;

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

    // 2. Backfill all tenant-scoped documents missing tenantId to DEFAULT tenant
    console.log('\n📦 Backfilling tenant-scoped documents to DEFAULT tenant...');
    for (const { name, model } of BACKFILL_COLLECTIONS) {
      const result = await model.updateMany(
        { tenantId: { $exists: false } },
        { $set: { tenantId } }
      );
      console.log(`✅ ${name}: updated ${result.modifiedCount} documents`);
    }

    // 3. Category & Unit: mark existing as isSystem=true (already default true for new)
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

    // 4. Drop legacy global unique indexes (keep users.email + tenants.*)
    await dropLegacyGlobalUniques(db);

    // 5. Verify load-bearing uniques preserved
    await verifyUsersEmailAndTenantsUnique(db);

    // 6. Verify no legacy single-field uniques remain
    const violations = await verifyNoLegacySingleFieldUniques(db);

    console.log('\n🎉 Migration complete!');
    if (violations > 0) {
      console.log(`⚠️  ${violations} legacy single-field unique index(es) remain — review manually`);
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
