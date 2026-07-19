import mongoose from 'mongoose';

import connectDB from '#config/database';

import {
  seedOwner,
  seedUnits,
} from './seeders/index.js';

const runSeeder = async () => {
  try {
    await connectDB();

    console.log(
      'Database seeding started...'
    );

    await seedOwner();

    await seedUnits();

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
