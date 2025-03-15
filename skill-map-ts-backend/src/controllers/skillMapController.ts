// src/controllers/skillMapController.ts
import { Request, Response, NextFunction } from 'express';
import { SkillMapService } from '../services';
import logger from '../utils/logger';
import { ApplicationError } from '../middleware/errorHandler';
import { SkillMapRequestSchema } from '../models/dto/SkillMapDto';
import searchSkillMaps from './searchSkillMaps';

// Initialize service
const skillMapService = new SkillMapService();

/**
 * Generate a new skill map
 */
export const generateSkillMap = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body (should already be validated by middleware)
    const validatedData = SkillMapRequestSchema.parse(req.body);
    
    logger.info(`Generating skill map for: ${validatedData.skill_name}`);
    
    // Call service to generate skill map
    const skillMap = await skillMapService.generateSkillMap(validatedData);
    
    // Return response
    return res.status(201).json({
      success: true,
      data: skillMap,
      message: 'Skill map generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a skill map by ID
 */
export const getSkillMapById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      throw new ApplicationError('Skill map ID is required', 400);
    }
    
    logger.info(`Retrieving skill map with ID: ${id}`);
    
    // Call service to get skill map
    const skillMap = await skillMapService.getSkillMapById(id);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: skillMap,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get skill maps for a user
 */
export const getSkillMapsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      throw new ApplicationError('User ID is required', 400);
    }
    
    logger.info(`Retrieving skill maps for user: ${userId}`);
    
    // Call service to get user's skill maps
    const skillMaps = await skillMapService.getSkillMapsByUserId(userId);
    
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

/**
 * Delete a skill map
 */
export const deleteSkillMap = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      throw new ApplicationError('Skill map ID is required', 400);
    }
    
    logger.info(`Deleting skill map with ID: ${id}`);
    
    // Call service to delete skill map
    await skillMapService.deleteSkillMap(id);
    
    // Return response
    return res.status(200).json({
      success: true,
      message: 'Skill map deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Export the refined search function
export { searchSkillMaps };