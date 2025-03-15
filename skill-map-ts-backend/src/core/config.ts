// src/core/config.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Configuration interface
interface Config {
  port: number;
  mongodbUri: string;
  aiServiceUrl: string;
  logLevel: string;
  openaiApiKey?: string;
  nodeEnv: string;
}

// Create configuration object
const config: Config = {
  port: parseInt(process.env.PORT || '8080', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb+srv://sman0084:74oIoVjIw2XfzMYv@unihack25.lmhyf.mongodb.net/skillmaps',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000/api',
  logLevel: process.env.LOG_LEVEL || 'info',
  openaiApiKey: process.env.OPENAI_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development'
};

export default config;