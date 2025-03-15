// src/config/env.ts
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const env = {
  development: {
    API_URL: 'http://localhost:8080/api',  // Direct connection to TypeScript backend
    ENABLE_MOCKS: true,  // Set to true for testing
    API_TIMEOUT: 10000000, // 30 seconds
  },
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 8080,
  
  // Python API Service
  PYTHON_API_BASE_URL: process.env.PYTHON_API_BASE_URL || 'http://localhost:8000',
  API_TIMEOUT: process.env.API_TIMEOUT ? parseInt(process.env.API_TIMEOUT, 10) : 10000000, // 30 seconds
  
  // MongoDB connection
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/skillmap',
  
  // API prefix
  API_PREFIX: process.env.API_PREFIX || '/api',
};

export default env;