// src/api/models/userProfile.ts
import { z } from 'zod';
import { 
  TimeAvailabilitySchema, 
  LearningStylePreferenceSchema, 
  SkillLevelSchema,
  LearningStyle,
  SkillLevel
} from './base';
import mongoose from 'mongoose';

// Zod Schema for User Profile
export const UserProfileSchema = z.object({
  userId: z.string().min(1),
  currentSkillLevel: SkillLevelSchema,
  learningStylePreferences: LearningStylePreferenceSchema,
  timeAvailability: TimeAvailabilitySchema,
  backgroundKnowledge: z.array(z.string()).optional(),
  goals: z.array(z.string()).optional()
});

// TypeScript Interface
export interface UserProfile {
  userId: string;
  currentSkillLevel: SkillLevel;
  learningStylePreferences: LearningStyle[];
  timeAvailability: {
    hoursPerWeek: number;
    preferredSessionLength?: number;
    preferredDays?: string[];
  };
  backgroundKnowledge?: string[];
  goals?: string[];
}

// Mongoose Schema
const userProfileMongooseSchema = new mongoose.Schema<UserProfile>({
  userId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  currentSkillLevel: { 
    type: String, 
    enum: Object.values(SkillLevel),
    required: true 
  },
  learningStylePreferences: [{
    type: String,
    enum: Object.values(LearningStyle)
  }],
  timeAvailability: {
    hoursPerWeek: { 
      type: Number, 
      required: true,
      min: 0,
      max: 168
    },
    preferredSessionLength: Number,
    preferredDays: [String]
  },
  backgroundKnowledge: [String],
  goals: [String]
}, {
  timestamps: true
});

// Create and export the Mongoose Model
export const UserProfileModel = mongoose.model<UserProfile>('UserProfile', userProfileMongooseSchema);