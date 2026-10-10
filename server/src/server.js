import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDB(); // do not accept traffic until the database is ready

  const server = app.listen(env.port, () => {
    logger.info(`API running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  // Graceful shutdown: finish in-flight requests, then close the database connection
  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});   // <-- this block at the very bottom is what actually runs start()