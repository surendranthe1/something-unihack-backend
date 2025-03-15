// src/services/skillMapService.ts
import pythonApiClient from '../utils/pythonApiClient';
import cacheService from './cacheService';
import logger from '../utils/logger';
import SkillMap, { ISkillMap } from '../models/SkillMap';
import { ApplicationError } from '../middleware/errorHandler';
import { SkillMapRequest, UserProfile, LearningPreferences } from '../models/dto/SkillMapDto';

const USE_MOCK_DATA = true;

class SkillMapService {
  /**
   * Generate a skill map using the Python AI service
   */
  async generateSkillMap(request: SkillMapRequest): Promise<ISkillMap> {
    try {
      // Generate cache key based on request parameters
      const cacheKey = this.generateCacheKey(request);
      
      // Check if we have this skill map in cache
      const cachedMap = cacheService.get<ISkillMap>(cacheKey);
      if (cachedMap) {
        logger.info(`Returning cached skill map for: ${request.skill_name}`);
        return cachedMap;
      }
      
      // Call the Python API to generate the skill map
      console.log(`Generating skill map for: ${request.skill_name}`);
      
      // This should now return response.data directly
      const responseData = await pythonApiClient.post<any>('/api/generate_skill_map', request);
      
      console.log('Raw API response data type:', typeof responseData);
      console.log('Raw API response data keys:', responseData ? Object.keys(responseData) : 'null');
      
      // We now see the response has skill_map and user_id keys
      if (!responseData || !responseData.skill_map) {
        throw new ApplicationError('Invalid or missing skill map in API response', 500);
      }
      
      const skillMapData = responseData.skill_map;
      console.log('Skill map data keys:', Object.keys(skillMapData));
      console.log('Skill map nodes:', skillMapData.nodes ? 'present' : 'missing');
      
      // Add an ID if missing
      if (!skillMapData.id) {
        skillMapData.id = `sm-${Date.now()}`;
      }
      
      // Save to MongoDB
      const skillMap = new SkillMap({
        id: skillMapData.id,
        root_skill: skillMapData.root_skill,
        nodes: skillMapData.nodes || {},  // Provide empty object if nodes is missing
        total_estimated_hours: skillMapData.total_estimated_hours || 0,
        expected_completion_date: skillMapData.expected_completion_date || new Date(),
        user_id: responseData.user_id || request.user_profile?.user_id
      });
      
      await skillMap.save();
      
      // Cache the result for future requests
      cacheService.set(cacheKey, skillMap, 3600); // Cache for 1 hour
      
      return skillMap;
    } catch (error: any) {  // Explicitly type error as any
      logger.error('Error generating skill map:', error);
      
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
      
      throw new ApplicationError('Failed to generate skill map', 500);
    }
  }
  
  /**
   * Get a skill map by ID
   */
  async getSkillMapById(id: string): Promise<ISkillMap> {
    try {
      const skillMap = await SkillMap.findById(id);
      
      if (!skillMap) {
        throw new ApplicationError(`Skill map with ID ${id} not found`, 404);
      }
      
      return skillMap;
    } catch (error: any) {  // Explicitly type error as any
      logger.error(`Error retrieving skill map with ID ${id}:`, error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to retrieve skill map', 500);
    }
  }
  
  /**
   * Get skill maps for a specific user
   */
  async getSkillMapsByUserId(userId: string): Promise<ISkillMap[]> {
    try {
      const skillMaps = await SkillMap.find({ user_id: userId }).sort({ created_at: -1 });
      return skillMaps;
    } catch (error: any) {  // Explicitly type error as any
      logger.error(`Error retrieving skill maps for user ${userId}:`, error);
      throw new ApplicationError('Failed to retrieve user skill maps', 500);
    }
  }
  
  /**
   * Create a cache key based on request parameters
   */
  private generateCacheKey(request: SkillMapRequest): string {
    // For simple requests, just use the skill name
    if (!request.user_profile && !request.learning_preferences) {
      return `skill-map:${request.skill_name.toLowerCase()}`;
    }
    
    // For personalized requests, include relevant parameters in the key
    const skillKey = request.skill_name.toLowerCase();
    const skillLevel = request.user_profile?.current_skill_level || '';
    const timeAvailability = request.user_profile?.time_availability?.hours_per_week.toString() || '';
    const learningStyles = request.user_profile?.learning_style_preferences?.join('-') || '';
    
    return `skill-map:${skillKey}:${skillLevel}:${timeAvailability}:${learningStyles}`;
  }
  
  /**
   * Delete a skill map by ID
   */
  async deleteSkillMap(id: string): Promise<boolean> {
    try {
      const result = await SkillMap.findByIdAndDelete(id);
      
      if (!result) {
        throw new ApplicationError(`Skill map with ID ${id} not found`, 404);
      }
      
      logger.info(`Deleted skill map with ID ${id}`);
      return true;
    } catch (error: any) {  // Explicitly type error as any
      logger.error(`Error deleting skill map with ID ${id}:`, error);
      
      if (error instanceof ApplicationError) {
        throw error;
      }
      
      throw new ApplicationError('Failed to delete skill map', 500);
    }
  }
  
  /**
   * Search for skill maps by name
   */
  async searchSkillMaps(query: string, limit: number = 10): Promise<ISkillMap[]> {
    try {
      // Create a regex for case-insensitive search
      const searchRegex = new RegExp(query, 'i');
      
      const skillMaps = await SkillMap.find({ 
        root_skill: searchRegex 
      })
      .limit(limit)
      .sort({ created_at: -1 });
      
      return skillMaps;
    } catch (error: any) {  // Explicitly type error as any
      logger.error(`Error searching skill maps with query "${query}":`, error);
      throw new ApplicationError('Failed to search skill maps', 500);
    }
  }
}

export default SkillMapService;