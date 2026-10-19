import mongoose from 'mongoose';

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

const BACKFILL_COLLECTIONS = [
  { name: 'User', model: User },
  { name: 'Ingredient', model: Ingredient },
  { name: 'Recipe', model: Recipe },
  { name: 'Purchase', model: Purchase },
  { name: 'Menu', model: Menu },
  { name: 'Supplier', model: Supplier },
  { name: 'StockAdjustment', model: StockAdjustment },
];

async function migrate() {
  const uri = 'mongodb://root:adminhost123@localhost:27017/kitchen-ledger?authSource=admin&directConnection=true';
  console.log('🔗 Connecting to:', uri.replace(/:[^:@]+@/, ':***@'));
  await mongoose.connect(uri);
  console.log('✅ Connected');

  let tenant = await Tenant.findOne({ code: 'DEFAULT' });
  if (!tenant) {
    tenant = await Tenant.create({
      code: 'DEFAULT',
      name: 'Default Tenant',
      status: 'ACTIVE',
      plan: 'FREE',
      settings: { currency: 'IDR', timezone: 'Asia/Jakarta' },
    });
    console.log('✅ Created DEFAULT tenant:', tenant._id);
  } else {
    console.log('✅ Found DEFAULT tenant:', tenant._id);
  }
  const tenantId = tenant._id;

  for (const { name, model } of BACKFILL_COLLECTIONS) {
    const result = await model.updateMany(
      { tenantId: { $exists: false } },
      { $set: { tenantId } }
    );
    console.log(`✅ ${name}: updated ${result.modifiedCount} documents`);
  }

  const catResult = await Category.updateMany({ isSystem: { $exists: false } }, { $set: { isSystem: true } });
  console.log(`✅ Category: marked ${catResult.modifiedCount} as system`);
  const unitResult = await Unit.updateMany({ isSystem: { $exists: false } }, { $set: { isSystem: true } });
  console.log(`✅ Unit: marked ${unitResult.modifiedCount} as system`);

  const db = mongoose.connection.db;
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
  console.log('\n🧹 Dropping legacy global unique indexes...');
  for (const [collectionName, indexNames] of Object.entries(COLLECTION_INDEX_DROPS)) {
    const collection = db.collection(collectionName);
    const existing = await collection.indexes();
    for (const indexName of indexNames) {
      const hasIndex = existing.some((i) => i.name === indexName);
      if (!hasIndex) continue;
      const indexInfo = existing.find((i) => i.name === indexName);
      const isUnique = indexInfo && indexInfo.unique === true;
      const isSingleField = indexInfo && Object.keys(indexInfo.key || {}).length === 1 && !indexInfo.key._id;
      if (isUnique && isSingleField) {
        await collection.dropIndex(indexName);
        console.log(`   ✅ Dropped ${collectionName}.${indexName}`);
      }
    }
  }
  console.log('   ✅ Legacy index cleanup done');

  console.log('\n🎉 Migration complete!');
  process.exit(0);
}

migrate().catch((e) => { console.error('❌ Migration failed:', e.message); process.exit(1); });
