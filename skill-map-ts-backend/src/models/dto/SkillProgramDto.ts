// src/models/dto/SkillProgramDto.ts
import { z } from 'zod';
import { UserProfileSchema, LearningPreferencesSchema, SkillResourceSchema } from './SkillMapDto';

// Schema for daily task
export const DailyTaskSchema = z.object({
  day: z.number().int().min(1).max(30),
  name: z.string().min(1, 'Task name is required'),
  description: z.string().min(1, 'Task description is required'),
  difficulty_level: z.string().min(1, 'Difficulty level is required'),
  estimated_hours: z.number().positive(),
  resources: z.array(SkillResourceSchema).default([]),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started')
});

// Schema for generating a skill program
export const SkillProgramRequestSchema = z.object({
  skill_name: z.string().min(1, 'Skill name is required'),
  user_profile: UserProfileSchema.optional(),
  learning_preferences: LearningPreferencesSchema.optional()
});

// Schema for skill program response
export const SkillProgramResponseSchema = z.object({
  id: z.string(),
  skill_name: z.string(),
  description: z.string(),
  daily_tasks: z.array(DailyTaskSchema),
  total_hours: z.number(),
  expected_completion_date: z.string().or(z.date()),
  user_id: z.string().optional(),
  created_at: z.string().or(z.date()).optional(),
  updated_at: z.string().or(z.date()).optional()
});

// Schema for task progress update
export const TaskProgressUpdateSchema = z.object({
  day: z.number().int().min(1).max(30),
  completion_percentage: z.number().min(0).max(100),
  time_spent: z.number().min(0),
  notes: z.string().optional()
});

// Schema for progress update request
export const ProgressUpdateRequestSchema = z.object({
  user_id: z.string(),
  skill_program_id: z.string(),
  progress_data: z.array(TaskProgressUpdateSchema),
  context_changes: z.array(
    z.object({
      change_type: z.string(),
      description: z.string(),
      impact_factor: z.number().min(-1).max(1),
      affected_period: z.object({
        start: z.string().or(z.date()),
        end: z.string().or(z.date())
      })
    })
  ).optional()
});

// Export types derived from the schemas
export type DailyTask = z.infer<typeof DailyTaskSchema>;
export type SkillProgramRequest = z.infer<typeof SkillProgramRequestSchema>;
export type SkillProgramResponse = z.infer<typeof SkillProgramResponseSchema>;
export type TaskProgressUpdate = z.infer<typeof TaskProgressUpdateSchema>;
export type ProgressUpdateRequest = z.infer<typeof ProgressUpdateRequestSchema>;