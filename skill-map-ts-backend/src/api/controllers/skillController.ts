// src/api/controllers/skillController.ts
import { Request, Response } from 'express';
import skillMapService from '../../services/skillMapService';
import { 
  SkillMapRequest, 
  SkillMapResponse 
} from '../models';
import logger from '../../core/logger';

class SkillController {
  /**
   * Generate a new skill map
   * @param req Express request object
   * @param res Express response object
   */
  async generateSkillMap(req: Request, res: Response) {
    try {
      const request: SkillMapRequest = req.body;
      console.log('Received Skill Map Request:', JSON.stringify(req.body, null, 2));
      const skillMap = await skillMapService.generateSkillMap(request);
      
      const response: SkillMapResponse = {
        skillMap,
        userId: request.userProfile?.userId
      };
      
      res.status(201).json(response);
    } catch (error) {
      logger.error('Failed to generate skill map', { 
        error: error instanceof Error ? error.message : error,
        skillName: req.body.skillName 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to generate skill map';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }

  /**
   * Get a specific skill map
   * @param req Express request object
   * @param res Express response object
   */
  async getSkillMap(req: Request, res: Response) {
    try {
      const { skillMapId } = req.params;
      
      const skillMap = await skillMapService.getSkillMap(skillMapId);
      
      if (!skillMap) {
        return res.status(404).json({ 
          error: 'Skill map not found' 
        });
      }
      
      res.json(skillMap);
    } catch (error) {
      logger.error('Failed to retrieve skill map', { 
        error: error instanceof Error ? error.message : error,
        skillMapId: req.params.skillMapId 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve skill map';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }

  /**
   * Get all skill maps for a user
   * @param req Express request object
   * @param res Express response object
   */
  async getUserSkillMaps(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      
      const skillMaps = await skillMapService.getUserSkillMaps(userId);
      
      res.json(skillMaps);
    } catch (error) {
      logger.error('Failed to retrieve user skill maps', { 
        error: error instanceof Error ? error.message : error,
        userId: req.params.userId 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve user skill maps';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }

  /**
   * Delete a skill map
   * @param req Express request object
   * @param res Express response object
   */
  async deleteSkillMap(req: Request, res: Response) {
    try {
      const { skillMapId } = req.params;
      
      const deletedSkillMap = await skillMapService.deleteSkillMap(skillMapId);
      
      if (!deletedSkillMap) {
        return res.status(404).json({ 
          error: 'Skill map not found' 
        });
      }
      
      res.json(deletedSkillMap);
    } catch (error) {
      logger.error('Failed to delete skill map', { 
        error: error instanceof Error ? error.message : error,
        skillMapId: req.params.skillMapId 
      });

      const errorMessage = error instanceof Error ? error.message : 'Failed to delete skill map';
      res.status(500).json({ 
        error: errorMessage 
      });
    }
  }
}

export default new SkillController();