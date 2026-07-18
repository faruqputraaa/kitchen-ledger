import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

const connectDatabase = async () => {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.mongoUri);

    logger.info('MongoDB Connected');
  } catch (error) {
    logger.error(error.stack);

    process.exit(1);
  }
};

export default connectDatabase;
