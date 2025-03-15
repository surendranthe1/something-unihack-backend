// src/config/server.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import env from './env';
import { errorHandler } from '../middleware/errorHandler';
import logger from '../utils/logger';

export function configureServer(app: Application): void {
  // Security middleware
  app.use(helmet());
  
  // CORS configuration
  app.use(cors());
  
  // Parse JSON bodies
  app.use(bodyParser.json());
  
  // Parse URL-encoded bodies
  app.use(bodyParser.urlencoded({ extended: true }));
  
  // Simple logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
  
  // Configure base API path
  app.use(env.API_PREFIX, (req, res, next) => {
    next();
  });
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // Global error handling middleware (should be applied last)
  app.use(errorHandler);
}

export default { configureServer };