// src/api/controllers/progressController.ts
import { Request, Response } from 'express';
import progressService from '../../services/progressService';
import { 
  ProgressUpdateRequest, 
  ProgressUpdateResponse,
  ProgressData,
  ContextChange
} from '../models';
import logger from '../../core/logger';

class ProgressController {
  /**
   * Record progress for a skill map
   * @param req Express request object
   * @param res Express response object
   */
  async recordProgress(req: Request, res: Response) {
    try {
      const { 
        userId, 
        skillMapId, 
        progressData, 
        contextChanges 
      }: ProgressUpdateRequest = req.body;
      
      // Record progress
      const updatedSkillMap = await progressService.recordProgress(
        skillMapId, 
        userId, 
        progressData
      );
      
      // If context changes exist, record them
      let adjustmentSummary: string | undefined;
      if (contextChanges && contextChanges.length > 0) {
        await progressService.recordContextChanges(
          skillMapId, 
          userId, 
          contextChanges
        );
        adjustmentSummary = `Recorded ${contextChanges.length} context changes`;
      }
      
      // Prepare response
      const response: ProgressUpdateResponse = {
        updatedSkillMap,
        userId,
        skillMapId,
        adjustmentSummary
      };
      
      res.status(200).json(response);
    } catch (error) {
      logger.error('Failed to record progress', { 
        error: error instanceof Error ? error.message : error,
        skillMapId: req.body.skillMapId,
        userId: req.body.userId 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to record progress';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }

  /**
   * Retrieve progress history for a skill map
   * @param req Express request object
   * @param res Express response object
   */
  async getProgressHistory(req: Request, res: Response) {
    try {
      const { skillMapId } = req.params;
      
      const progressHistory: ProgressData[] = await progressService.getProgressHistory(skillMapId);
      
      res.json(progressHistory);
    } catch (error) {
      logger.error('Failed to retrieve progress history', { 
        error: error instanceof Error ? error.message : error,
        skillMapId: req.params.skillMapId 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve progress history';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }

  /**
   * Retrieve context change history for a skill map
   * @param req Express request object
   * @param res Express response object
   */
  async getContextChangeHistory(req: Request, res: Response) {
    try {
      const { skillMapId } = req.params;
      
      const contextChangeHistory: ContextChange[] = await progressService.getContextChangeHistory(skillMapId);
      
      res.json(contextChangeHistory);
    } catch (error) {
      logger.error('Failed to retrieve context change history', { 
        error: error instanceof Error ? error.message : error,
        skillMapId: req.params.skillMapId 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve context change history';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }
}

export default new ProgressController();