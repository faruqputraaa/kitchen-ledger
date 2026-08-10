import mongoose from 'mongoose';

import connectDB from '#config/database';

import {
  seedOwner,
  seedUnits,
  seedCategories,
} from './seeders/index.js';

import seedCounters from '#shared/counter/counter.seed';

const runSeeder = async () => {
  try {
    await connectDB();

    console.log(
      'Database seeding started...'
    );

    await seedOwner();

    await seedCategories();
    await seedUnits();
    
    await seedCounters();

    console.log(
      'Database seeding completed'
    );

    await mongoose.connection.close();

    process.exit(0);
  } catch (error) {
    console.error(
      'Seeder failed:',
      error
    );

    await mongoose.connection.close();

    process.exit(1);
  }
};

runSeeder();
