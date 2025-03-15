// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApplicationError } from './errorHandler';

type RequestLocation = 'body' | 'params' | 'query';

/**
 * Middleware factory that validates request data using Zod schemas
 * @param schema Zod schema to validate against
 * @param source Which part of the request to validate (body, params, query)
 */
export const validate = (
  schema: ZodSchema,
  source: RequestLocation = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get data from the specified location
      const data = req[source];
      
      // Parse request data against schema
      const result = schema.parse(data);
      
      // Replace the request data with the validated result
      req[source] = result;
      
      // Continue with the request
      next();
    } catch (error) {
      // Format Zod errors to be more user-friendly
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        
        next(new ApplicationError(
          `Validation error: ${JSON.stringify(formattedErrors)}`,
          400
        ));
      } else {
        next(error);
      }
    }
  };
};

export default validate;