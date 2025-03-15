// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

// Custom error class with status code
export class ApplicationError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default status code and error message
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  
  // Check if this is our custom ApplicationError
  if (err instanceof ApplicationError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from mongoose or zod)
    statusCode = 400;
    errorMessage = err.message;
  }
  
  // Log the error
  logger.error(`Error: ${errorMessage}`, {
    path: req.path,
    method: req.method,
    statusCode,
    error: err.stack || err.message,
  });
  
  // Send response to client
  res.status(statusCode).json({
    error: {
      message: errorMessage,
      status: statusCode,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

// 404 handler middleware
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      status: 404,
    },
  });
};