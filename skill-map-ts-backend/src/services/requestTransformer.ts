// src/services/requestTransformer.ts
import { SkillMapRequest } from '../api/models';

export function transformRequestForPythonAPI(request: SkillMapRequest) {

  if (!request.userProfile) {
    throw new Error('User profile is required for skill map generation');
  }

  return {
    skill_name: request.skillName,
    user_profile: {
      user_id: request.userProfile.userId,
      current_skill_level: request.userProfile.currentSkillLevel,
      learning_style_preferences: request.userProfile.learningStylePreferences,
      time_availability: {
        hours_per_week: request.userProfile.timeAvailability.hoursPerWeek,
        preferred_session_length: request.userProfile.timeAvailability.preferredSessionLength || 0,
        preferred_days: request.userProfile.timeAvailability.preferredDays || []
      },
      background_knowledge: request.userProfile.backgroundKnowledge || [],
      goals: request.userProfile.goals || []
    },
    learning_preferences: {
      resource_types: request.learningPreferences?.resourceTypes || ["courses", "articles", "videos"],
      difficulty_progression: request.learningPreferences?.difficultyProgression || "gradual",
      focus_areas: request.learningPreferences?.focusAreas || request.userProfile.goals || []
    },
    time_frame: request.timeFrame || 90
  };
}