// src/app.ts
import express from 'express';
import env from './config/env';
import { connectToDatabase } from './config/database';
import { configureServer } from './config/server';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';

// Initialize express app
const app = express();

// Configure server (middleware, security, etc.)
configureServer(app);

// Register API routes
app.use(env.API_PREFIX, routes);

// 404 handler for undefined routes
app.use('*', notFoundHandler);

// Global error handler
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    
    // Start the server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`API accessible at http://localhost:${env.PORT}${env.API_PREFIX}`);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err: Error) => {
      logger.error('Unhandled Rejection:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
    
    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        logger.info('Process terminated');
      });
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
export default app;