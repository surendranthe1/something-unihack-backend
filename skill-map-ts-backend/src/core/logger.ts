// src/core/logger.ts
import winston from 'winston';
import config from './config';

// Create a custom format for logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create a logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for errors
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    
    // File transport for combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Add a stream for morgan to use with express logging
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  }
};

export default logger;