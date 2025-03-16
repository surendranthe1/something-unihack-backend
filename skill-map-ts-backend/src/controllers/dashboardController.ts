// src/controllers/dashboardController.ts
import { Request, Response, NextFunction } from 'express';
import { UserProgressService } from '../services/userProgressService';
import logger from '../utils/logger';
import { ApplicationError } from '../middleware/errorHandler';

// Initialize service
const userProgressService = new UserProgressService();

/**
 * Get dashboard data for the current user
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
    
    // Get dashboard data from service
    const dashboardData = await userProgressService.getDashboardData(userId);
    
    // Return response with dashboard data
    return res.status(200).json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a quick summary of user progress stats
 */
export const getUserStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      throw new ApplicationError('User ID is required', 400);
    }
    
    logger.info(`Retrieving quick stats for user ${userId}`);
    
    // Get dashboard data - we'll extract just the stats we need
    const dashboardData = await userProgressService.getDashboardData(userId);
    
    // Return just the high-level stats
    return res.status(200).json({
      success: true,
      data: {
        overall_completion_rate: dashboardData.overall_completion_rate,
        days_completed: dashboardData.days_completed,
        streak_days: dashboardData.streak_days,
        badge_count: dashboardData.badge_count
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};