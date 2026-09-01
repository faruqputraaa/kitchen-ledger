import app from './app.js';
import env from './config/env.js';
import connectDatabase from './config/database.js';
import logger from './config/logger.js';
import seedCounters from '#shared/counter/counter.seed';
import { seedCategories } from '#shared/database/seeders/category.seed';
import { seedOwner } from '#shared/database/seeders/owner.seed';
import { seedUnits } from '#shared/database/seeders/unit.seed';

const startServer = async () => {
  await connectDatabase();
  await seedCounters();
  await seedCategories();
  await seedOwner();
  await seedUnits();

  app.listen(env.port, () => {
    logger.info('===================================');
    logger.info('Kitchen Ledger API Started');
    logger.info(`Environment : ${env.nodeEnv}`);
    logger.info(`Port        : ${env.port}`);
    logger.info('===================================');
  });
};

startServer();
