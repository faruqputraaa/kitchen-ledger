import app from './app.js';
import env from './config/env.js';
import connectDatabase from './config/database.js';
import logger from './config/logger.js';
import seedCounters from '#shared/counter/counter.seed';

const startServer = async () => {
  await connectDatabase();
  await seedCounters();
    
  app.listen(env.port, () => {
    logger.info('===================================');
    logger.info('Kitchen Ledger API Started');
    logger.info(`Environment : ${env.nodeEnv}`);
    logger.info(`Port        : ${env.port}`);
    logger.info('===================================');
  });
};

startServer();