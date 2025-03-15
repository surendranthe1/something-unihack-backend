// src/models/dto/SkillMapDto.ts
import { z } from 'zod';

// Define Zod schema for learning style enum
export const LearningStyleSchema = z.enum([
  'visual',
  'auditory',
  'reading',
  'kinesthetic',
]);

// Define Zod schema for skill level enum
export const SkillLevelSchema = z.enum([
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

// Time availability schema
export const TimeAvailabilitySchema = z.object({
  hours_per_week: z.number().positive(),
  preferred_session_length: z.number().positive().optional(),
  preferred_days: z.array(z.string()).optional(),
});

// User profile schema
export const UserProfileSchema = z.object({
  user_id: z.string(),
  current_skill_level: SkillLevelSchema,
  learning_style_preferences: z.array(LearningStyleSchema),
  time_availability: TimeAvailabilitySchema,
  background_knowledge: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
});

// Learning preferences schema
export const LearningPreferencesSchema = z.object({
  resource_types: z.array(z.string()).default(['courses', 'articles', 'videos']),
  difficulty_progression: z.string().default('gradual'),
  focus_areas: z.array(z.string()).optional(),
});

// Skill resource schema
export const SkillResourceSchema = z.object({
  type: z.string(),
  name: z.string(),
  url: z.string().url().optional(),
  description: z.string().optional(),
});

// Schema for generating a skill map
export const SkillMapRequestSchema = z.object({
  skill_name: z.string().min(1, 'Skill name is required'),
  user_profile: UserProfileSchema.optional(),
  learning_preferences: LearningPreferencesSchema.optional(),
  time_frame: z.number().int().positive().optional(),
});

// Export types derived from the schemas
export type LearningStyle = z.infer<typeof LearningStyleSchema>;
export type SkillLevel = z.infer<typeof SkillLevelSchema>;
export type TimeAvailability = z.infer<typeof TimeAvailabilitySchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LearningPreferences = z.infer<typeof LearningPreferencesSchema>;
export type SkillResource = z.infer<typeof SkillResourceSchema>;
export type SkillMapRequest = z.infer<typeof SkillMapRequestSchema>;