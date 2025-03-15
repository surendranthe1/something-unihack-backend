// src/services/progressService.ts
import { ProgressDataModel, ContextChangeModel } from '../api/models/progress';
import skillMapService from './skillMapService';
import logger from '../core/logger';
import { 
  ProgressData, 
  ContextChange,
  SkillMap
} from '../api/models';
import mongoose from 'mongoose';

class ProgressService {
  /**
   * Record progress for a specific skill node
   * @param skillMapId Skill map identifier
   * @param userId User identifier
   * @param progressData Progress data to record
   * @returns Updated skill map
   */
  async recordProgress(
    skillMapId: string, 
    userId: string, 
    progressData: ProgressData[]
  ): Promise<SkillMap> {
    try {
      // Save individual progress records
      const progressRecords = progressData.map(progress => 
        new ProgressDataModel({
          _id: new mongoose.Types.ObjectId(),
          ...progress
        })
      );
      await ProgressDataModel.insertMany(progressRecords);

      // Update skill map progress
      const updatedSkillMap = await skillMapService.updateProgress(
        skillMapId, 
        userId, 
        progressData
      );

      logger.info('Progress recorded', { 
        skillMapId, 
        userId, 
        nodeIds: progressData.map(p => p.nodeId) 
      });

      return updatedSkillMap;
    } catch (error) {
      logger.error('Failed to record progress', { 
        error: error instanceof Error ? error.message : error,
        skillMapId,
        userId 
      });

      throw new Error('Failed to record progress');
    }
  }

  /**
   * Record context changes affecting learning progress
   * @param skillMapId Skill map identifier
   * @param userId User identifier
   * @param contextChanges Context changes to record
   * @returns Updated skill map
   */
  async recordContextChanges(
    skillMapId: string, 
    userId: string, 
    contextChanges: ContextChange[]
  ): Promise<SkillMap> {
    try {
      // Save context change records
      const changeRecords = contextChanges.map(change => 
        new ContextChangeModel({
          _id: new mongoose.Types.ObjectId(),
          ...change
        })
      );
      await ContextChangeModel.insertMany(changeRecords);

      // Update skill map with context changes
      const updatedSkillMap = await skillMapService.updateProgress(
        skillMapId, 
        userId, 
        [], 
        contextChanges
      );

      logger.info('Context changes recorded', { 
        skillMapId, 
        userId, 
        changeTypes: contextChanges.map(c => c.changeType) 
      });

      return updatedSkillMap;
    } catch (error) {
      logger.error('Failed to record context changes', { 
        error: error instanceof Error ? error.message : error,
        skillMapId,
        userId 
      });

      throw new Error('Failed to record context changes');
    }
  }

  /**
   * Retrieve progress history for a skill map
   * @param skillMapId Skill map identifier
   * @returns Array of progress records
   */
  async getProgressHistory(skillMapId: string): Promise<ProgressData[]> {
    try {
      const progressRecords = await ProgressDataModel.find({ 
        'skillMapId': skillMapId 
      }).sort({ createdAt: -1 });

      return progressRecords.map(record => record.toObject());
    } catch (error) {
      logger.error('Failed to retrieve progress history', { 
        error: error instanceof Error ? error.message : error,
        skillMapId 
      });

      throw new Error('Failed to retrieve progress history');
    }
  }

  /**
   * Retrieve context change history for a skill map
   * @param skillMapId Skill map identifier
   * @returns Array of context change records
   */
  async getContextChangeHistory(skillMapId: string): Promise<ContextChange[]> {
    try {
      const contextChanges = await ContextChangeModel.find({ 
        'skillMapId': skillMapId 
      }).sort({ createdAt: -1 });

      return contextChanges.map(change => change.toObject());
    } catch (error) {
      logger.error('Failed to retrieve context change history', { 
        error: error instanceof Error ? error.message : error,
        skillMapId 
      });

      throw new Error('Failed to retrieve context change history');
    }
  }
}

export default new ProgressService();