// src/services/aiService.ts
import axios, { AxiosInstance } from 'axios';
import config from '../core/config';
import logger from '../core/logger';
import { 
  SkillMapRequest, 
  SkillMap, 
  SkillMapRequest as AIServiceRequest 
} from '../api/models';
import { transformRequestForPythonAPI } from './requestTransformer';

class AIService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.aiServiceUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  

  /**
   * Generate a skill map using the AI microservice
   * @param request Skill map generation request
   * @returns Generated skill map
   */
  async generateSkillMap(request: SkillMapRequest): Promise<SkillMap> {
    try {
      const transformedRequest = transformRequestForPythonAPI(request);
      
      console.log('Transformed Request for Python API:', JSON.stringify(transformedRequest, null, 2));

      const response = await this.client.post<SkillMap>('/generate_skill_map', transformedRequest);
      
      console.log('Raw AI Service Response:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('AI Service Generation Error:', {
        error: error instanceof Error ? error.message : error,
        responseData: (error as any).response?.data,
        responseStatus: (error as any).response?.status
      });

      throw new Error(`Failed to generate skill map from AI service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update skill map progress through AI microservice
   * @param skillMapId Skill map identifier
   * @param userId User identifier
   * @param progressData Progress update details
   * @returns Updated skill map
   */
  async updateProgress(
    skillMapId: string, 
    userId: string, 
    progressData: any[]
  ): Promise<SkillMap> {
    try {
      const response = await this.client.post<SkillMap>('/update_progress', {
        skill_map_id: skillMapId,
        user_id: userId,
        progress_data: progressData
      });

      logger.info('Skill map progress updated', { 
        skillMapId, 
        userId 
      });

      return response.data;
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
   * Retrieve a generated skill map
   * @param skillMapId Skill map identifier
   * @returns Retrieved skill map
   */
  async getSkillMap(skillMapId: string): Promise<SkillMap> {
    try {
      const response = await this.client.get<SkillMap>(`/skill_maps/${skillMapId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve skill map', { 
        error: error instanceof Error ? error.message : error,
        skillMapId 
      });

      throw new Error('Failed to retrieve skill map');
    }
  }
}




export default new AIService();