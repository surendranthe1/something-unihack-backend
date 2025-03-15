// src/controllers/searchSkillMaps.ts
import { Request, Response, NextFunction } from 'express';
import { SkillMapService } from '../services';
import logger from '../utils/logger';
import { ApplicationError } from '../middleware/errorHandler';

// Initialize service
const skillMapService = new SkillMapService();

/**
 * Search skill maps
 */
export const searchSkillMaps = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Safely extract query parameters with proper type checks
    const searchQuery = req.query.q as string | undefined;
    const limitParam = req.query.limit ? Number(req.query.limit) : undefined;
    
    // Validate required parameters
    if (!searchQuery) {
      throw new ApplicationError('Search query (q) is required', 400);
    }
    
    // Use a default limit if not provided or if it's not a valid number
    const searchLimit = (!limitParam || isNaN(limitParam)) ? 10 : limitParam;
    
    logger.info(`Searching skill maps with query: ${searchQuery}, limit: ${searchLimit}`);
    
    // Call service to search skill maps
    const skillMaps = await skillMapService.searchSkillMaps(searchQuery, searchLimit);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: skillMaps,
      count: skillMaps.length,
    });
  } catch (error) {
    next(error);
  }
};

export default searchSkillMaps;