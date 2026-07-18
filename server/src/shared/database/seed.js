import mongoose from 'mongoose';

import connectDB from '#config/database';

import {
  seedCategories,
  seedUnits,
  seedSuppliers,
  seedIngredients,
} from './seeders/index.js';


const runSeeder = async () => {
  try {

    await connectDB();

    console.log(
      '🌱 Database seeding started...'
    );


    await seedCategories();

    await seedUnits();

    await seedSuppliers();

    await seedIngredients();


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