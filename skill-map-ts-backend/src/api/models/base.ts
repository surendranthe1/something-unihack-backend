// src/api/models/base.ts
import { z } from 'zod';

// Enums
export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  READING = 'reading',
  KINESTHETIC = 'kinesthetic'
}

export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

// Zod Schemas for Validation
export const TimeAvailabilitySchema = z.object({
  hoursPerWeek: z.number().min(0).max(168),
  preferredSessionLength: z.number().optional(),
  preferredDays: z.array(z.string()).optional()
});

export interface TimeAvailability {
  hoursPerWeek: number;
  preferredSessionLength?: number;
  preferredDays?: string[];
}

export const LearningStylePreferenceSchema = z.array(
  z.nativeEnum(LearningStyle)
).optional();

export const SkillLevelSchema = z.nativeEnum(SkillLevel);