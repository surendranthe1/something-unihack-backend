// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './core/config';
import logger from './core/logger';
import database from './core/database';
import { errorMiddleware } from './middlewares/errorMiddleware';
import routes from './api/routes';

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.connectToDatabase();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares() {
    // Security middleware
    this.app.use(helmet());

    // CORS middleware
    this.app.use(cors({
      origin: [
        'http://localhost:5173', // React frontend
        'http://localhost:8080'  // Potential admin frontend
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private async connectToDatabase() {
    try {
      await database.connect();
    } catch (error) {
      logger.error('Failed to connect to database', { error });
      process.exit(1);
    }
  }

  private initializeRoutes() {
    // Health check route
    this.app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      });
    });

    // Mount application routes
    this.app.use('/api', routes);
  }

  private initializeErrorHandling() {
    // Error middleware (should be last)
    this.app.use(errorMiddleware);
  }

  public listen() {
    const server = this.app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully');
      server.close(() => {
        database.disconnect();
        process.exit(0);
      });
    });

    return server;
  }
}

// Instantiate and start the application
const app = new App();
app.listen();

export default app;