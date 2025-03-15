// src/services/skillProgramService.ts
import pythonApiClient from '../utils/pythonApiClient';
import cacheService from './cacheService';
import logger from '../utils/logger';
import SkillProgram, { ISkillProgram } from '../models/SkillProgram';
import { ApplicationError } from '../middleware/errorHandler';
import { SkillProgramRequest, TaskProgressUpdate } from '../models/dto/SkillProgramDto';

class SkillProgramService {
  /**
   * Generate a 30-day skill program using the Python AI service
   */
  async generateSkillProgram(request: SkillProgramRequest): Promise<ISkillProgram> {
    try {
      // Generate cache key based on request parameters
      const cacheKey = this.generateCacheKey(request);
      
      // Check if we have this skill program in cache
      const cachedProgram = cacheService.get<ISkillProgram>(cacheKey);
      if (cachedProgram) {
        logger.info(`Returning cached skill program for: ${request.skill_name}`);
        return cachedProgram;
      }
      
      // Call the Python API to generate the skill program
      console.log(`Generating skill program for: ${request.skill_name}`);
      
      const responseData = await pythonApiClient.post<any>('/api/generate_skill_program', request);
      
      console.log('Raw API response data type:', typeof responseData);
      console.log('Raw API response data keys:', responseData ? Object.keys(responseData) : 'null');
      
      if (!responseData || !responseData.skill_program) {
        throw new ApplicationError('Invalid or missing skill program in API response', 500);
      }
      
      const skillProgramData = responseData.skill_program;
      
      // Add an ID if missing
      if (!skillProgramData.id) {
        skillProgramData.id = `sp-${Date.now()}`;
      }
      
      // Save to MongoDB
      const skillProgram = new SkillProgram({
        id: skillProgramData.id,
        skill_name: skillProgramData.skill_name,
        description: skillProgramData.description,
        daily_tasks: skillProgramData.daily_tasks || [],
        total_hours: skillProgramData.total_hours || 0,
        expected_completion_date: skillProgramData.expected_completion_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        user_id: responseData.user_id || request.user_profile?.user_id
      });
      
      await skillProgram.save();
      
      // Cache the result for future requests
      cacheService.set(cacheKey, skillProgram, 3600); // Cache for 1 hour
      
      return skillProgram;
    } catch (error: any) {
      logger.error('Error generating skill program:', error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      // Handle Axios errors specifically
      if (error.response) {
        throw new ApplicationError(
          `Python API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          502 // Bad Gateway
        );
      }
      
      throw new ApplicationError('Failed to generate skill program', 500);
    }
  }
  
  /**
   * Get a skill program by ID
   */
  async getSkillProgramById(id: string): Promise<ISkillProgram> {
    try {
      const skillProgram = await SkillProgram.findById(id);
      
      if (!skillProgram) {
        throw new ApplicationError(`Skill program with ID ${id} not found`, 404);
      }
      
      return skillProgram;
    } catch (error: any) {
      logger.error(`Error retrieving skill program with ID ${id}:`, error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to retrieve skill program', 500);
    }
  }
  
  /**
   * Get skill programs for a specific user
   */
  async getSkillProgramsByUserId(userId: string): Promise<ISkillProgram[]> {
    try {
      const skillPrograms = await SkillProgram.find({ user_id: userId }).sort({ created_at: -1 });
      return skillPrograms;
    } catch (error: any) {
      logger.error(`Error retrieving skill programs for user ${userId}:`, error);
      throw new ApplicationError('Failed to retrieve user skill programs', 500);
    }
  }
  
  /**
   * Update progress for daily tasks
   */
  async updateTaskProgress(
    skillProgramId: string, 
    userId: string, 
    progressUpdates: TaskProgressUpdate[]
  ): Promise<ISkillProgram> {
    try {
      // Format the request for the Python API
      const request = {
        user_id: userId,
        skill_program_id: skillProgramId,
        progress_data: progressUpdates.map(update => ({
          node_id: update.day.toString(), // Convert day number to string for compatibility
          completion_percentage: update.completion_percentage,
          time_spent: update.time_spent,
          notes: update.notes
        }))
      };
      
      // Call the Python API to update progress
      const responseData = await pythonApiClient.post<any>('/api/task/update_progress', request);
      
      if (!responseData || !responseData.updated_skill_map) {
        throw new ApplicationError('Invalid or missing updated skill program in API response', 500);
      }
      
      // Update our local MongoDB record
      const skillProgram = await SkillProgram.findById(skillProgramId);
      
      if (!skillProgram) {
        throw new ApplicationError(`Skill program with ID ${skillProgramId} not found`, 404);
      }
      
      // Update the daily tasks with the progress information
      for (const update of progressUpdates) {
        const taskIndex = skillProgram.daily_tasks.findIndex(task => task.day === update.day);
        
        if (taskIndex !== -1) {
          skillProgram.daily_tasks[taskIndex].progress = update.completion_percentage;
          skillProgram.daily_tasks[taskIndex].status = this.determineStatus(update.completion_percentage);
        }
      }
      
      // Save the updated program
      await skillProgram.save();
      
      return skillProgram;
    } catch (error: any) {
      logger.error(`Error updating task progress for program ${skillProgramId}:`, error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to update task progress', 500);
    }
  }
  
  /**
   * Delete a skill program by ID
   */
  async deleteSkillProgram(id: string): Promise<boolean> {
    try {
      const result = await SkillProgram.findByIdAndDelete(id);
      
      if (!result) {
        throw new ApplicationError(`Skill program with ID ${id} not found`, 404);
      }
      
      logger.info(`Deleted skill program with ID ${id}`);
      return true;
    } catch (error: any) {
      logger.error(`Error deleting skill program with ID ${id}:`, error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to delete skill program', 500);
    }
  }
  
  /**
   * Search for skill programs by name
   */
  async searchSkillPrograms(query: string, limit: number = 10): Promise<ISkillProgram[]> {
    try {
      // Create a regex for case-insensitive search
      const searchRegex = new RegExp(query, 'i');
      
      const skillPrograms = await SkillProgram.find({ 
        skill_name: searchRegex 
      })
      .limit(limit)
      .sort({ created_at: -1 });
      
      return skillPrograms;
    } catch (error: any) {
      logger.error(`Error searching skill programs with query "${query}":`, error);
      throw new ApplicationError('Failed to search skill programs', 500);
    }
  }
  
  /**
   * Create a cache key based on request parameters
   */
  private generateCacheKey(request: SkillProgramRequest): string {
    // For simple requests, just use the skill name
    if (!request.user_profile && !request.learning_preferences) {
      return `skill-program:${request.skill_name.toLowerCase()}`;
    }
    
    // For personalized requests, include relevant parameters in the key
    const skillKey = request.skill_name.toLowerCase();
    const skillLevel = request.user_profile?.current_skill_level || '';
    const timeAvailability = request.user_profile?.time_availability?.hours_per_week.toString() || '';
    const learningStyles = request.user_profile?.learning_style_preferences?.join('-') || '';
    
    return `skill-program:${skillKey}:${skillLevel}:${timeAvailability}:${learningStyles}`;
  }
  
  /**
   * Determine status based on completion percentage
   */
  private determineStatus(completionPercentage: number): string {
    if (completionPercentage === 0) {
      return 'not_started';
    } else if (completionPercentage < 100) {
      return 'in_progress';
    } else {
      return 'completed';
    }
  }
}

export default SkillProgramService;