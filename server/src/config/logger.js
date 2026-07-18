import fs from 'fs';
import path from 'path';
import winston from 'winston';

const logDirectory = path.join(process.cwd(), 'src', 'logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',

  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),

    winston.format.errors({
      stack: true,
    }),

    winston.format.printf((info) => {
      return `[${info.timestamp}] ${info.level.toUpperCase()} : ${info.message}`;
    })
  ),

  transports: [
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
    }),

    new winston.transports.File({
      filename: path.join(logDirectory, 'application.log'),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),

        winston.format.timestamp({
          format: 'HH:mm:ss',
        }),

        winston.format.printf((info) => {
          return `${info.timestamp} ${info.level}: ${info.message}`;
        })
      ),
    })
  );
}

export default logger;
