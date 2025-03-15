// src/middlewares/errorMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../core/logger';

// Base custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Ensures that the error can be properly identified as an AppError
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict in resource state') {
    super(message, 409);
  }
}

// Global error handling middleware
export const errorMiddleware = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default error properties
  let statusCode = 500;
  let errorResponse = {
    status: 'error',
    message: 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorResponse.message = err.message;
  }

  // Log the error
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path
  });

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Async error wrapper to avoid try-catch in every route
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};