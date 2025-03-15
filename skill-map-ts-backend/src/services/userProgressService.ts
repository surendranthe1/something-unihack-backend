// src/services/UserProgressService.ts
import mongoose from 'mongoose';
import UserProgress, { UserProgressDocument } from '../models/UserProgress';
import SkillMap from '../models/SkillMap';
import User from '../models/user';
import { ApplicationError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class UserProgressService {
  /**
   * Initialize user progress tracking for a skill map
   */
  async initializeProgress(userId: string, skillMapId: string): Promise<UserProgressDocument> {
    try {
      // Verify user exists
      const userExists = await User.exists({ userId });
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
        userId, 
        skillMapId: new mongoose.Types.ObjectId(skillMapId) 
      });
      
      if (existingProgress) {
        return existingProgress;
      }
      
      // Create initial skill progress map with all nodes at 0%
      const skillProgress = new Map();
      
      skillMap.nodes.forEach((node, nodeId) => {
        skillProgress.set(nodeId, {
          nodeId,
          completionPercentage: 0,
          timeSpent: 0,
          startedAt: undefined,
          completedAt: undefined
        });
      });
      
      // Create new progress document
      const userProgress = new UserProgress({
        userId,
        skillMapId: new mongoose.Types.ObjectId(skillMapId),
        skillProgress,
        startDate: new Date(),
        dailyProgress: [{
          date: new Date(),
          minutesSpent: 0,
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
  async getProgress(userId: string, skillMapId: string): Promise<UserProgressDocument> {
    try {
      const progress = await UserProgress.findOne({ 
        userId, 
        skillMapId: new mongoose.Types.ObjectId(skillMapId) 
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
  ): Promise<UserProgressDocument> {
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
      const nodeProgress = progress.skillProgress.get(nodeId);
      
      if (!nodeProgress) {
        throw new ApplicationError('Skill node not found', 404);
      }
      
      // Update node progress
      const updatedNodeProgress = {
        ...nodeProgress,
        completionPercentage,
        timeSpent: nodeProgress.timeSpent + timeSpent,
        notes: notes || nodeProgress.notes
      };
      
      // Set startedAt if not already set and progress > 0
      if (!nodeProgress.startedAt && completionPercentage > 0) {
        updatedNodeProgress.startedAt = new Date();
      }
      
      // Set completedAt if reaching 100%
      if (completionPercentage === 100 && nodeProgress.completionPercentage < 100) {
        updatedNodeProgress.completedAt = new Date();
        
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
            earnedAt: new Date()
          });
        }
      }
      
      // Update the node in the map
      progress.skillProgress.set(nodeId, updatedNodeProgress);
      
      // Calculate overall completion rate
      const totalNodes = progress.skillProgress.size;
      const completedNodes = Array.from(progress.skillProgress.values())
        .filter(node => node.completionPercentage === 100).length;
      
      progress.overallCompletionRate = (completedNodes / totalNodes) * 100;
      
      // Update last activity
      progress.lastActivity = new Date();
      
      // Add to daily progress
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayProgressIndex = progress.dailyProgress.findIndex(day => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      });
      
      if (todayProgressIndex >= 0) {
        // Update existing entry
        progress.dailyProgress[todayProgressIndex].minutesSpent += Math.round(timeSpent / 60);
        
        // Mark as completed if total time today is >= 30 minutes
        if (progress.dailyProgress[todayProgressIndex].minutesSpent >= 30) {
          progress.dailyProgress[todayProgressIndex].completed = true;
          
          // Increment days completed if not already counted
          if (!progress.dailyProgress[todayProgressIndex].completed) {
            progress.daysCompleted += 1;
            
            // Update streak
            progress.streakDays += 1;
            
            // Update longest streak if current streak is longer
            if (progress.streakDays > progress.longestStreak) {
              progress.longestStreak = progress.streakDays;
            }
            
            // Award streak badges
            this.checkAndAwardStreakBadges(progress);
          }
        }
      } else {
        // Add new entry for today
        progress.dailyProgress.push({
          date: today,
          minutesSpent: Math.round(timeSpent / 60),
          completed: Math.round(timeSpent / 60) >= 30
        });
        
        // Check if streak is broken (no activity yesterday)
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdayProgress = progress.dailyProgress.find(day => {
          const dayDate = new Date(day.date);
          dayDate.setHours(0, 0, 0, 0);
          return dayDate.getTime() === yesterday.getTime();
        });
        
        if (!yesterdayProgress || !yesterdayProgress.completed) {
          // Reset streak
          progress.streakDays = 1;
        } else {
          // Continue streak
          progress.streakDays += 1;
          
          // Update longest streak if current streak is longer
          if (progress.streakDays > progress.longestStreak) {
            progress.longestStreak = progress.streakDays;
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
   * Get user progress dashboard data
   */
  async getDashboardData(userId: string): Promise<any> {
    try {
      // Get all user progress documents
      const allProgress = await UserProgress.find({ userId })
        .sort({ lastActivity: -1 });
      
      if (allProgress.length === 0) {
        return {
          daysCompleted: 0,
          streakDays: 0,
          longestStreak: 0,
          overallCompletionRate: 0,
          badgeCount: 0,
          skillMaps: [],
          recentActivity: [],
          upcomingSkills: []
        };
      }
      
      // Get all skill maps for the user's progress
      const skillMapIds = allProgress.map(progress => progress.skillMapId);
      const skillMaps = await SkillMap.find({ _id: { $in: skillMapIds } });
      
      // Map skill maps to their IDs for easy lookup
      const skillMapMap = new Map();
      skillMaps.forEach(map => skillMapMap.set(map._id.toString(), map));
      
      // Aggregate data from all progress documents
      const totalDaysCompleted = allProgress.reduce((sum, progress) => sum + progress.daysCompleted, 0);
      const currentStreak = Math.max(...allProgress.map(progress => progress.streakDays));
      const longestStreak = Math.max(...allProgress.map(progress => progress.longestStreak));
      
      // Count total badges
      const badgeCount = allProgress.reduce((sum, progress) => sum + progress.badges.length, 0);
      
      // Calculate weighted average completion rate
      const totalSkillMaps = allProgress.length;
      const overallCompletionRate = allProgress.reduce(
        (sum, progress) => sum + progress.overallCompletionRate,
        0
      ) / totalSkillMaps;
      
      // Get most recent activity (last 7 days)
      const recentActivityMap = new Map();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      allProgress.forEach(progress => {
        progress.dailyProgress
          .filter(day => new Date(day.date) >= oneWeekAgo)
          .forEach(day => {
            const date = new Date(day.date).toISOString().split('T')[0];
            const current = recentActivityMap.get(date) || 0;
            recentActivityMap.set(date, current + day.minutesSpent);
          });
      });
      
      const recentActivity = Array.from(recentActivityMap.entries())
        .map(([date, minutes]) => ({ date, minutes }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Get active skill maps with completion rates
      const activeSkillMaps = allProgress.map(progress => {
        const skillMap = skillMapMap.get(progress.skillMapId.toString());
        return {
          id: progress.skillMapId.toString(),
          name: skillMap ? skillMap.rootSkill : 'Unknown Skill',
          completionRate: progress.overallCompletionRate,
          daysCompleted: progress.daysCompleted,
          lastActivity: progress.lastActivity
        };
      });
      
      // Get upcoming skills (nodes with low progress)
      const upcomingSkills = [];
      
      allProgress.forEach(progress => {
        const skillMap = skillMapMap.get(progress.skillMapId.toString());
        if (!skillMap) return;
        
        // Get skills that are started but not completed
        Array.from(progress.skillProgress.entries())
          .filter(([_, node]) => node.completionPercentage > 0 && node.completionPercentage < 100)
          .slice(0, 3) // Limit to 3 per skill map
          .forEach(([nodeId, node]) => {
            const skillNode = skillMap.nodes.get(nodeId);
            if (skillNode) {
              upcomingSkills.push({
                id: nodeId,
                name: skillNode.name,
                skillMapId: progress.skillMapId.toString(),
                skillMapName: skillMap.rootSkill,
                completionPercentage: node.completionPercentage,
                estimatedTimeRemaining: skillNode.estimatedHours * (1 - node.completionPercentage / 100) * 60 // in minutes
              });
            }
          });
      });
      
      // Sort upcoming skills by completion percentage
      upcomingSkills.sort((a, b) => a.completionPercentage - b.completionPercentage);
      
      return {
        daysCompleted: totalDaysCompleted,
        streakDays: currentStreak,
        longestStreak,
        overallCompletionRate,
        badgeCount,
        skillMaps: activeSkillMaps,
        recentActivity,
        upcomingSkills: upcomingSkills.slice(0, 5) // Return only top 5 skills
      };
    } catch (error: any) {
      logger.error(`Error retrieving dashboard data for user ${userId}:`, error);
      throw new ApplicationError(`Failed to retrieve dashboard data: ${error.message}`, 500);
    }
  }
  
  /**
   * Helper to check and award streak badges
   */
  private checkAndAwardStreakBadges(progress: UserProgressDocument): void {
    // Define streak milestones for badges
    const streakMilestones = [3, 7, 14, 30, 60, 90];
    
    // Check if current streak hits any milestone
    streakMilestones.forEach(milestone => {
      if (progress.streakDays === milestone) {
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
            earnedAt: new Date()
          });
        }
      }
    });
  }
}

export default UserProgressService;