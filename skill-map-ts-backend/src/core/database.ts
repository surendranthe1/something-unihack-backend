// src/core/database.ts
import mongoose from 'mongoose';
import logger from './logger';
import config from './config';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: mongoose.Connection | null = null;

  private constructor() {}

  /**
   * Get singleton instance of DatabaseConnection
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Establish connection to MongoDB
   */
  public async connect(): Promise<mongoose.Connection> {
    if (this.connection) {
      return this.connection;
    }

    try {
      // Set mongoose options for better connection management
      mongoose.set('strictQuery', false);

      // Establish connection
      await mongoose.connect(config.mongodbUri, {
        // Connection options
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });

      this.connection = mongoose.connection;

      // Connection success logging
      this.connection.on('connected', () => {
        logger.info('MongoDB connection established successfully');
      });

      // Connection error handling
      this.connection.on('error', (error) => {
        logger.error('MongoDB connection error', { error });
      });

      // Disconnection handling
      this.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      return this.connection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB', { error });
      throw error;
    }
  }

  /**
   * Close database connection
   */
  public async disconnect(): Promise<void> {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      logger.info('MongoDB connection closed');
    }
  }

  /**
   * Reconnect to the database
   */
  public async reconnect(): Promise<mongoose.Connection> {
    await this.disconnect();
    return this.connect();
  }
}

export default DatabaseConnection.getInstance();