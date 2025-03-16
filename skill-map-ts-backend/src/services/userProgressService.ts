// src/services/UserProgressService.ts
import mongoose, { Document } from 'mongoose';
import UserProgress, { IUserProgress } from '../models/UserProgress';
import SkillMap, { ISkillMap } from '../models/SkillMap';
import User from '../models/User';
import { ApplicationError } from '../middleware/errorHandler';
import logger from '../utils/logger';

// Define interfaces for dashboard data types
interface UpcomingSkill {
  id: string;
  name: string;
  skill_map_id: string;
  skill_map_name: string;
  completion_percentage: number;
  estimated_time_remaining: number;
}

interface ActiveSkillMap {
  id: string;
  name: string;
  completion_rate: number;
  days_completed: number;
  last_activity: Date;
}

interface RecentActivity {
  date: string;
  minutes: number;
}

interface SkillCategory {
  name: string;
  count: number;
  completed: number;
  color: string;
  completion_percentage: number;
}

interface DashboardData {
  days_completed: number;
  streak_days: number;
  longest_streak: number;
  overall_completion_rate: number;
  badge_count: number;
  skill_maps: ActiveSkillMap[];
  recent_activity: RecentActivity[];
  upcoming_skills: UpcomingSkill[];
  skill_categories: SkillCategory[];
}

// Define a type for the document with _id
type SkillMapDocument = Document & ISkillMap & { _id: mongoose.Types.ObjectId };

export class UserProgressService {
  /**
   * Initialize user progress tracking for a skill map
   */
  async initializeProgress(userId: string, skillMapId: string): Promise<IUserProgress> {
    try {
      // Verify user exists
      const userExists = await User.exists({ user_id: userId });
      if (!userExists) {
        throw new ApplicationError('User not found', 404);
      }
      
      // Verify skill map exists
      const skillMap = await SkillMap.findById(skillMapId);
      if (!skillMap) {
        throw new ApplicationError('Skill map not found', 404);
      }
      
      // Check if progress already exists
      const existingProgress = await UserProgress.findOne({ 
        user_id: userId, 
        skill_map_id: new mongoose.Types.ObjectId(skillMapId) 
      });
      
      if (existingProgress) {
        return existingProgress;
      }
      
      // Create initial skill progress map with all nodes at 0%
      const skillProgress = new Map();
      
      // If we're using the ISkillMap interface nodes are stored differently
      const nodes = skillMap.nodes as Record<string, any>;
      Object.keys(nodes).forEach(nodeId => {
        skillProgress.set(nodeId, {
          node_id: nodeId,
          completion_percentage: 0,
          time_spent: 0
        });
      });
      
      // Create new progress document
      const userProgress = new UserProgress({
        user_id: userId,
        skill_map_id: new mongoose.Types.ObjectId(skillMapId),
        skill_progress: skillProgress,
        start_date: new Date(),
        daily_progress: [{
          date: new Date(),
          minutes_spent: 0,
          completed: false
        }]
      });
      
      await userProgress.save();
      return userProgress;
    } catch (error: any) {
      logger.error(`Error initializing progress for user ${userId}, skill map ${skillMapId}:`, error);
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(`Failed to initialize progress: ${error.message}`, 500);
    }
  }
  
  /**
   * Get user progress for a skill map
   */
  async getProgress(userId: string, skillMapId: string): Promise<IUserProgress> {
    try {
      const progress = await UserProgress.findOne({ 
        user_id: userId, 
        skill_map_id: new mongoose.Types.ObjectId(skillMapId) 
      });
      
      if (!progress) {
        throw new ApplicationError('Progress not found', 404);
      }
      
      return progress;
    } catch (error: any) {
      logger.error(`Error retrieving progress for user ${userId}, skill map ${skillMapId}:`, error);
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(`Failed to retrieve progress: ${error.message}`, 500);
    }
  }
  
  /**
   * Update skill node progress
   */
  async updateSkillProgress(
    userId: string, 
    skillMapId: string, 
    nodeId: string, 
    completionPercentage: number,
    timeSpent: number,
    notes?: string
  ): Promise<IUserProgress> {
    try {
      // Validate inputs
      if (completionPercentage < 0 || completionPercentage > 100) {
        throw new ApplicationError('Completion percentage must be between 0 and 100', 400);
      }
      
      if (timeSpent < 0) {
        throw new ApplicationError('Time spent cannot be negative', 400);
      }
      
      // Get user progress
      const progress = await this.getProgress(userId, skillMapId);
      
      // Get current node progress
      const nodeProgress = progress.skill_progress.get(nodeId);
      
      if (!nodeProgress) {
        throw new ApplicationError('Skill node not found', 404);
      }
      
      // Update node progress
      const updatedNodeProgress = {
        ...nodeProgress,
        completion_percentage: completionPercentage,
        time_spent: nodeProgress.time_spent + timeSpent,
        notes: notes || nodeProgress.notes
      };
      
      // Set started_at if not already set and progress > 0
      if (!nodeProgress.started_at && completionPercentage > 0) {
        updatedNodeProgress.started_at = new Date();
      }
      
      // Set completed_at if reaching 100%
      if (completionPercentage === 100 && nodeProgress.completion_percentage < 100) {
        updatedNodeProgress.completed_at = new Date();
        
        // Award a badge for completing a skill if it doesn't exist already
        const badgeExists = progress.badges.some(badge => 
          badge.id === `skill-complete-${nodeId}`
        );
        
        if (!badgeExists) {
          progress.badges.push({
            id: `skill-complete-${nodeId}`,
            name: 'Skill Mastered',
            description: `Completed the skill: ${nodeId}`,
            category: 'skill-completion',
            earned_at: new Date()
          });
        }
      }
      
      // Update the node in the map
      progress.skill_progress.set(nodeId, updatedNodeProgress);
      
      // Calculate overall completion rate
      const totalNodes = progress.skill_progress.size;
      const completedNodes = Array.from(progress.skill_progress.values())
        .filter(node => node.completion_percentage === 100).length;
      
      progress.overall_completion_rate = (completedNodes / totalNodes) * 100;
      
      // Update last activity
      progress.last_activity = new Date();
      
      // Add to daily progress
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayProgressIndex = progress.daily_progress.findIndex(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });
      
      if (todayProgressIndex >= 0) {
        // Update existing entry
        progress.daily_progress[todayProgressIndex].minutes_spent += Math.round(timeSpent / 60);
        
        // Mark as completed if total time today is >= 30 minutes
        if (progress.daily_progress[todayProgressIndex].minutes_spent >= 30) {
          progress.daily_progress[todayProgressIndex].completed = true;
          
          // Increment days completed if not already counted
          if (!progress.daily_progress[todayProgressIndex].completed) {
            progress.days_completed += 1;
            
            // Update streak
            progress.streak_days += 1;
            
            // Update longest streak if current streak is longer
            if (progress.streak_days > progress.longest_streak) {
              progress.longest_streak = progress.streak_days;
            }
            
            // Award streak badges
            this.checkAndAwardStreakBadges(progress);
          }
        }
      } else {
        // Add new entry for today
        progress.daily_progress.push({
          date: today,
          minutes_spent: Math.round(timeSpent / 60),
          completed: Math.round(timeSpent / 60) >= 30
        });
        
        // Check if streak is broken (no activity yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayProgress = progress.daily_progress.find(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() === yesterday.getTime();
        });
        
        if (!yesterdayProgress || !yesterdayProgress.completed) {
          // Reset streak
          progress.streak_days = 1;
        } else {
          // Continue streak
          progress.streak_days += 1;
          
          // Update longest streak if current streak is longer
          if (progress.streak_days > progress.longest_streak) {
            progress.longest_streak = progress.streak_days;
          }
          
          // Award streak badges
          this.checkAndAwardStreakBadges(progress);
        }
      }
      
      // Save updates
      await progress.save();
      return progress;
    } catch (error: any) {
      logger.error(
        `Error updating skill progress for user ${userId}, skill map ${skillMapId}, node ${nodeId}:`, 
        error
      );
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(`Failed to update skill progress: ${error.message}`, 500);
    }
  }
  
  /**
   * Get user progress dashboard data - calculates all metrics for the dashboard
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      // Get all user progress documents
      const allProgress = await UserProgress.find({ user_id: userId })
        .sort({ last_activity: -1 });
      
      if (allProgress.length === 0) {
        return {
          days_completed: 0,
          streak_days: 0,
          longest_streak: 0,
          overall_completion_rate: 0,
          badge_count: 0,
          skill_maps: [],
          recent_activity: [],
          upcoming_skills: [],
          skill_categories: []
        };
      }
      
      // Get all skill maps for the user's progress
      const skillMapIds = allProgress.map(progress => progress.skill_map_id);
      const skillMaps = await SkillMap.find({ _id: { $in: skillMapIds } });
      
      // Map skill maps to their IDs for easy lookup - FIXED THIS PART
      const skillMapMap = new Map<string, SkillMapDocument>();
      
      skillMaps.forEach((map) => {
        const typedMap = map as SkillMapDocument;
        const mapId = typedMap._id.toString();
        skillMapMap.set(mapId, typedMap);
      });
      
      // Aggregate data from all progress documents
      const totalDaysCompleted = allProgress.reduce((sum, progress) => sum + progress.days_completed, 0);
      const currentStreak = Math.max(...allProgress.map(progress => progress.streak_days));
      const longestStreak = Math.max(...allProgress.map(progress => progress.longest_streak));
      
      // Count total badges
      const badgeCount = allProgress.reduce((sum, progress) => sum + progress.badges.length, 0);
      
      // Calculate weighted average completion rate
      const totalSkillMaps = allProgress.length;
      const overallCompletionRate = allProgress.reduce(
        (sum, progress) => sum + progress.overall_completion_rate,
        0
      ) / totalSkillMaps;
      
      // Get most recent activity (last 7 days)
      const recentActivityMap = new Map<string, number>();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      allProgress.forEach(progress => {
        progress.daily_progress
          .filter(day => new Date(day.date) >= oneWeekAgo)
          .forEach(day => {
            const date = new Date(day.date).toISOString().split('T')[0];
            const current = recentActivityMap.get(date) || 0;
            recentActivityMap.set(date, current + day.minutes_spent);
          });
      });
      
      const recentActivity: RecentActivity[] = Array.from(recentActivityMap.entries())
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Get active skill maps with completion rates
      const activeSkillMaps: ActiveSkillMap[] = allProgress.map(progress => {
        const mapId = progress.skill_map_id.toString();
        const skillMap = skillMapMap.get(mapId);
        return {
          id: mapId,
          name: skillMap ? skillMap.root_skill : 'Unknown Skill',
          completion_rate: progress.overall_completion_rate,
          days_completed: progress.days_completed,
          last_activity: progress.last_activity
        };
      });
      
      // Get upcoming skills (nodes with low progress)
      const upcomingSkills: UpcomingSkill[] = [];
      
      allProgress.forEach(progress => {
        const mapId = progress.skill_map_id.toString();
        const skillMap = skillMapMap.get(mapId);
        if (!skillMap) return;
        
        // Get skills that are started but not completed
        Array.from(progress.skill_progress.entries())
          .filter(([_, node]) => node.completion_percentage > 0 && node.completion_percentage < 100)
          .slice(0, 3) // Limit to 3 per skill map
          .forEach(([nodeId, node]) => {
            const nodes = skillMap.nodes as Record<string, any>;
            const skillNode = nodes[nodeId];
            if (skillNode) {
              upcomingSkills.push({
                id: nodeId,
                name: skillNode.name,
                skill_map_id: mapId,
                skill_map_name: skillMap.root_skill,
                completion_percentage: node.completion_percentage,
                estimated_time_remaining: skillNode.estimated_hours * (1 - node.completion_percentage / 100) * 60 // in minutes
              });
            }
          });
      });
      
      // Sort upcoming skills by completion percentage
      upcomingSkills.sort((a, b) => a.completion_percentage - b.completion_percentage);
      
      // Get skill categories breakdown
      const skillCategories = this.calculateSkillCategories(allProgress, skillMapMap);
      
      return {
        days_completed: totalDaysCompleted,
        streak_days: currentStreak,
        longest_streak: longestStreak,
        overall_completion_rate: overallCompletionRate,
        badge_count: badgeCount,
        skill_maps: activeSkillMaps,
        recent_activity: recentActivity,
        upcoming_skills: upcomingSkills.slice(0, 5), // Return only top 5 skills
        skill_categories: skillCategories
      };
    } catch (error: any) {
      logger.error(`Error retrieving dashboard data for user ${userId}:`, error);
      throw new ApplicationError(`Failed to retrieve dashboard data: ${error.message}`, 500);
    }
  }
  
  /**
   * Calculate skill categories and their completion stats
   */
  private calculateSkillCategories(
    progresses: IUserProgress[], 
    skillMapMap: Map<string, SkillMapDocument>
  ): SkillCategory[] {
    // Define standard categories
    const categories: SkillCategory[] = [
      { name: "Core Fundamentals", count: 0, completed: 0, color: "from-pink-500 to-purple-600", completion_percentage: 0 },
      { name: "Practical Application", count: 0, completed: 0, color: "from-blue-500 to-indigo-600", completion_percentage: 0 },
      { name: "Advanced Techniques", count: 0, completed: 0, color: "from-green-500 to-teal-600", completion_percentage: 0 },
      { name: "Expert Level", count: 0, completed: 0, color: "from-yellow-500 to-amber-600", completion_percentage: 0 },
    ];
    
    // Process all progresses
    progresses.forEach(progress => {
      const mapId = progress.skill_map_id.toString();
      const skillMap = skillMapMap.get(mapId);
      if (!skillMap) return;
      
      // Process each node
      Array.from(progress.skill_progress.entries()).forEach(([nodeId, node]) => {
        const nodes = skillMap.nodes as Record<string, any>;
        const skillNode = nodes[nodeId];
        if (!skillNode) return;
        
        // Determine category based on depth
        let categoryIndex = 0;
        if (skillNode.depth === 0) {
          categoryIndex = 0; // Core Fundamentals
        } else if (skillNode.depth === 1) {
          categoryIndex = 1; // Practical Application
        } else if (skillNode.depth === 2) {
          categoryIndex = 2; // Advanced Techniques
        } else {
          categoryIndex = 3; // Expert Level
        }
        
        // Update category stats
        categories[categoryIndex].count++;
        if (node.completion_percentage === 100) {
          categories[categoryIndex].completed++;
        }
      });
    });
    
    // Calculate completion percentages
    return categories.map(category => ({
      ...category,
      completion_percentage: category.count > 0 
        ? Math.round((category.completed / category.count) * 100) 
        : 0
    }));
  }
  
  /**
   * Helper to check and award streak badges
   */
  private checkAndAwardStreakBadges(progress: IUserProgress): void {
    // Define streak milestones for badges
    const streakMilestones = [3, 7, 14, 30];
    
    // Check if current streak hits any milestone
    streakMilestones.forEach(milestone => {
      if (progress.streak_days === milestone) {
        const badgeId = `streak-${milestone}`;
        
        // Check if badge already exists
        const badgeExists = progress.badges.some(badge => badge.id === badgeId);
        
        if (!badgeExists) {
          // Award new badge
          progress.badges.push({
            id: badgeId,
            name: `${milestone}-Day Streak`,
            description: `Maintained a learning streak for ${milestone} consecutive days`,
            category: 'streak',
            earned_at: new Date()
          });
        }
      }
    });
  }
}

export default UserProgressService;