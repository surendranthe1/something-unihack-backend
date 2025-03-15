// src/middlewares/validationMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import logger from '../core/logger';

/**
 * Middleware to validate request body against Zod schema
 * @param schema Zod validation schema
 * @returns Middleware function
 */
export const validationMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      const validationResult = schema.safeParse(req.body);

      if (!validationResult.success) {
        // Log validation errors
        logger.warn('Validation failed', {
          errors: validationResult.error.errors
        });

        // Return detailed validation errors
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      }

      // If validation passes, attach the parsed data to the request
      req.body = validationResult.data;
      next();
    } catch (error) {
      logger.error('Validation middleware error', { 
        error: error instanceof Error ? error.message : error 
      });

      res.status(500).json({
        error: 'Internal server error during validation'
      });
    }
  };
};