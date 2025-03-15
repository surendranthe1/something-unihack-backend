// src/services/skillMapService.ts
import { SkillMapModel } from '../api/models/skillMap';
import { SkillNodeModel } from '../api/models/skillNode';
import aiService from './aiService';
import logger from '../core/logger';
import { 
  SkillMap, 
  SkillMapRequest, 
  ProgressData, 
  ContextChange,
  UserProfile 
} from '../api/models';
import mongoose from 'mongoose';

class SkillMapService {
  /**
   * Generate a new skill map
   * @param request Skill map generation request
   * @returns Generated and saved skill map
   */
  async generateSkillMap(request: SkillMapRequest): Promise<SkillMap> {
    try {
      // Use AI service to generate skill map
      const skillMapFromAI = await aiService.generateSkillMap(request);

      // Create Mongoose document
      const skillMapDocument = new SkillMapModel({
        id: new mongoose.Types.ObjectId().toString(),
        rootSkill: skillMapFromAI.rootSkill,
        nodes: skillMapFromAI.nodes,
        totalEstimatedHours: skillMapFromAI.totalEstimatedHours,
        expectedCompletionDate: skillMapFromAI.expectedCompletionDate,
        userId: request.userProfile?.userId
      });

      // Save to database
      await skillMapDocument.save();

      logger.info('Skill map generated and saved', { 
        rootSkill: skillMapFromAI.rootSkill,
        userId: request.userProfile?.userId 
      });

      return skillMapDocument.toObject();
    } catch (error) {
      logger.error('Failed to generate skill map', { 
        error: error instanceof Error ? error.message : error,
        skillName: request.skillName 
      });

      throw new Error('Failed to generate skill map');
    }
  }

  /**
   * Update progress for a skill map
   * @param skillMapId Skill map identifier
   * @param userId User identifier
   * @param progressData Progress update details
   * @param contextChanges Optional context changes
   * @returns Updated skill map
   */
  async updateProgress(
    skillMapId: string, 
    userId: string, 
    progressData: ProgressData[], 
    contextChanges?: ContextChange[]
  ): Promise<SkillMap> {
    try {
      // Find the existing skill map
      const existingSkillMap = await SkillMapModel.findById(skillMapId);

      if (!existingSkillMap) {
        throw new Error('Skill map not found');
      }

      // Use AI service to update progress
      const updatedSkillMapFromAI = await aiService.updateProgress(
        skillMapId, 
        userId, 
        progressData
      );

      // Update the existing skill map document
      existingSkillMap.nodes = updatedSkillMapFromAI.nodes;
      existingSkillMap.expectedCompletionDate = updatedSkillMapFromAI.expectedCompletionDate;

      // Save updated skill map
      await existingSkillMap.save();

      logger.info('Skill map progress updated', { 
        skillMapId, 
        userId 
      });

      return existingSkillMap.toObject();
    } catch (error) {
      logger.error('Failed to update skill map progress', { 
        error: error instanceof Error ? error.message : error,
        skillMapId,
        userId 
      });

      throw new Error('Failed to update skill map progress');
    }
  }

  /**
   * Retrieve a skill map by ID
   * @param skillMapId Skill map identifier
   * @returns Retrieved skill map
   */
  async getSkillMap(skillMapId: string): Promise<SkillMap | null> {
    try {
      const skillMap = await SkillMapModel.findById(skillMapId);
      return skillMap ? skillMap.toObject() : null;
    } catch (error) {
      logger.error('Failed to retrieve skill map', { 
        error: error instanceof Error ? error.message : error,
        skillMapId 
      });

      throw new Error('Failed to retrieve skill map');
    }
  }

  /**
   * Retrieve all skill maps for a user
   * @param userId User identifier
   * @returns List of user's skill maps
   */
  async getUserSkillMaps(userId: string): Promise<SkillMap[]> {
    try {
      const skillMaps = await SkillMapModel.find({ userId });
      return skillMaps.map(map => map.toObject());
    } catch (error) {
      logger.error('Failed to retrieve user skill maps', { 
        error: error instanceof Error ? error.message : error,
        userId 
      });

      throw new Error('Failed to retrieve user skill maps');
    }
  }

  /**
   * Delete a skill map
   * @param skillMapId Skill map identifier
   * @returns Deleted skill map
   */
  async deleteSkillMap(skillMapId: string): Promise<SkillMap | null> {
    try {
      const deletedSkillMap = await SkillMapModel.findByIdAndDelete(skillMapId);
      return deletedSkillMap ? deletedSkillMap.toObject() : null;
    } catch (error) {
      logger.error('Failed to delete skill map', { 
        error: error instanceof Error ? error.message : error,
        skillMapId 
      });

      throw new Error('Failed to delete skill map');
    }
  }
}

export default new SkillMapService();