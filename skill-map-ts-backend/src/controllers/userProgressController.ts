// src/controllers/userProgressController.ts
import { Request, Response, NextFunction } from 'express';
import { UserProgressService } from '../services/userProgressService';
import logger from '../utils/logger';
import { ApplicationError } from '../middleware/errorHandler';
import { z } from 'zod';

// Initialize service
const userProgressService = new UserProgressService();

/**
 * Initialize progress tracking for a skill map
 */
export const initializeProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const skillMapId = req.params.skillMapId;
    
    if (!userId || !skillMapId) {
      throw new ApplicationError('User ID and Skill Map ID are required', 400);
    }
    
    logger.info(`Initializing progress for user ${userId}, skill map ${skillMapId}`);
    
    const progress = await userProgressService.initializeProgress(userId, skillMapId);
    
    return res.status(201).json({
      success: true,
      data: progress,
      message: 'Progress tracking initialized successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user progress for a skill map
 */
export const getProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const skillMapId = req.params.skillMapId;
    
    if (!userId || !skillMapId) {
      throw new ApplicationError('User ID and Skill Map ID are required', 400);
    }
    
    logger.info(`Retrieving progress for user ${userId}, skill map ${skillMapId}`);
    
    const progress = await userProgressService.getProgress(userId, skillMapId);
    
    return res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update skill node progress
 */
export const updateSkillProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    const skillMapId = req.params.skillMapId;
    const nodeId = req.params.nodeId;
    
    if (!userId || !skillMapId || !nodeId) {
      throw new ApplicationError('User ID, Skill Map ID, and Node ID are required', 400);
    }
    
    // Validate request body
    const ProgressUpdateSchema = z.object({
      completionPercentage: z.number().min(0).max(100),
      timeSpent: z.number().min(0), // in minutes
      notes: z.string().optional()
    });
    
    const validatedData = ProgressUpdateSchema.parse(req.body);
    
    logger.info(`Updating progress for user ${userId}, skill map ${skillMapId}, node ${nodeId}`);
    
    const progress = await userProgressService.updateSkillProgress(
      userId,
      skillMapId,
      nodeId,
      validatedData.completionPercentage,
      validatedData.timeSpent,
      validatedData.notes
    );
    
    return res.status(200).json({
      success: true,
      data: progress,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get dashboard data for a user
 */
export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      throw new ApplicationError('User ID is required', 400);
    }
    
    logger.info(`Retrieving dashboard data for user ${userId}`);
    
    const dashboardData = await userProgressService.getDashboardData(userId);
    
    return res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};