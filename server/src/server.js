import app from './app.js';
import env from './config/env.js';
import connectDatabase from './config/database.js';
import logger from './config/logger.js';
import seedCounters from '#shared/counter/counter.seed';
import { seedCategories } from '#shared/database/seeders/category.seed';
import { seedOwner } from '#shared/database/seeders/owner.seed';
import { seedUnits } from '#shared/database/seeders/unit.seed';
import Tenant from '#modules/tenant/tenant.model';

const startTrialCron = () => {
  const check = async () => {
    try {
      const now = new Date();
      const result = await Tenant.updateMany(
        { status: 'TRIAL', trialEndsAt: { $lt: now } },
        { $set: { status: 'SUSPENDED' } }
      );
      if (result.modifiedCount > 0) {
        logger.info(`Trial cron: suspended ${result.modifiedCount} expired trial tenants`);
      }
    } catch (err) {
      logger.error('Trial cron error', err);
    }
  };
  // run hourly + once at startup after 10s
  setInterval(check, 60 * 60 * 1000);
  setTimeout(check, 10_000);
  logger.info('Trial expiry cron scheduled (hourly)');
};

const startServer = async () => {
  await connectDatabase();
  await seedCounters();
  await seedCategories();
  await seedOwner();
  await seedUnits();
  startTrialCron();

  app.listen(env.port, () => {
    logger.info('===================================');
    logger.info('Kitchen Ledger API Started');
    logger.info(`Environment : ${env.nodeEnv}`);
    logger.info(`Port        : ${env.port}`);
    logger.info('===================================');
  });
};

startServer();
