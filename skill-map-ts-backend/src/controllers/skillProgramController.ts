// src/controllers/skillProgramController.ts
import { Request, Response, NextFunction } from 'express';
import SkillProgramService from '../services/skillProgramService';
import logger from '../utils/logger';
import { ApplicationError } from '../middleware/errorHandler';
import { SkillProgramRequestSchema, ProgressUpdateRequestSchema } from '../models/dto/SkillProgramDto';

// Initialize service
const skillProgramService = new SkillProgramService();

/**
 * Generate a new 30-day skill program
 */
export const generateSkillProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body (should already be validated by middleware)
    const validatedData = SkillProgramRequestSchema.parse(req.body);
    
    logger.info(`Generating skill program for: ${validatedData.skill_name}`);
    
    // Call service to generate skill program
    const skillProgram = await skillProgramService.generateSkillProgram(validatedData);
    
    // Return response
    return res.status(201).json({
      success: true,
      data: skillProgram,
      message: 'Skill program generated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a skill program by ID
 */
export const getSkillProgramById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      throw new ApplicationError('Skill program ID is required', 400);
    }
    
    logger.info(`Retrieving skill program with ID: ${id}`);
    
    // Call service to get skill program
    const skillProgram = await skillProgramService.getSkillProgramById(id);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: skillProgram,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get skill programs for a user
 */
export const getSkillProgramsByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      throw new ApplicationError('User ID is required', 400);
    }
    
    logger.info(`Retrieving skill programs for user: ${userId}`);
    
    // Call service to get user's skill programs
    const skillPrograms = await skillProgramService.getSkillProgramsByUserId(userId);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: skillPrograms,
      count: skillPrograms.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update progress for daily tasks
 */
export const updateTaskProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate request body
    const validatedData = ProgressUpdateRequestSchema.parse(req.body);
    
    logger.info(`Updating task progress for program: ${validatedData.skill_program_id}`);
    
    // Call service to update progress
    const updatedProgram = await skillProgramService.updateTaskProgress(
      validatedData.skill_program_id,
      validatedData.user_id,
      validatedData.progress_data
    );
    
    // Return response
    return res.status(200).json({
      success: true,
      data: updatedProgram,
      message: 'Task progress updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a skill program
 */
export const deleteSkillProgram = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    
    if (!id) {
      throw new ApplicationError('Skill program ID is required', 400);
    }
    
    logger.info(`Deleting skill program with ID: ${id}`);
    
    // Call service to delete skill program
    await skillProgramService.deleteSkillProgram(id);
    
    // Return response
    return res.status(200).json({
      success: true,
      message: 'Skill program deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search skill programs
 */
export const searchSkillPrograms = async (
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
    
    logger.info(`Searching skill programs with query: ${searchQuery}, limit: ${searchLimit}`);
    
    // Call service to search skill programs
    const skillPrograms = await skillProgramService.searchSkillPrograms(searchQuery, searchLimit);
    
    // Return response
    return res.status(200).json({
      success: true,
      data: skillPrograms,
      count: skillPrograms.length,
    });
  } catch (error) {
    next(error);
  }
};