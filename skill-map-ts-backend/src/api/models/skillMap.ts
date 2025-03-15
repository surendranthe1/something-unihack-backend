// src/api/models/skillMap.ts
import { z } from 'zod';
import mongoose from 'mongoose';
import { SkillNodeSchema, SkillNode } from './skillNode';
import { UserProfileSchema } from './userProfile';

// Zod Schema for Skill Map
export const SkillMapSchema = z.object({
  id: z.string().min(1).optional(),
  rootSkill: z.string().min(1).optional(),
  nodes: z.record(z.string(), SkillNodeSchema).optional(),
  totalEstimatedHours: z.number().min(0).optional(),
  expectedCompletionDate: z.date().optional(),
  userId: z.string().optional()
});

// TypeScript Interface
export interface SkillMap {
  id: string;
  rootSkill: string;
  nodes: Record<string, SkillNode>;
  totalEstimatedHours: number;
  expectedCompletionDate: Date;
  userId?: string;
}

// Mongoose Schema
const skillMapMongooseSchema = new mongoose.Schema<SkillMap>({
  id: { 
    type: String, 
    required: true,
    unique: true 
  },
  rootSkill: { 
    type: String, 
    required: true 
  },
  nodes: {
    type: Map,
    of: {
      id: { 
        type: String, 
        required: true 
      },
      name: { 
        type: String, 
        required: true 
      },
      description: { 
        type: String, 
        required: true 
      },
      estimatedHours: { 
        type: Number, 
        required: true,
        min: 0 
      },
      parentId: String,
      children: [String],
      resources: [{
        type: { 
          type: String, 
          required: true 
        },
        name: { 
          type: String, 
          required: true 
        },
        url: String,
        description: String
      }],
      depth: { 
        type: Number, 
        default: 0,
        min: 0 
      },
      progress: { 
        type: Number, 
        default: 0,
        min: 0,
        max: 100 
      },
      status: { 
        type: String, 
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started' 
      }
    }
  },
  totalEstimatedHours: { 
    type: Number, 
    required: true,
    min: 0 
  },
  expectedCompletionDate: { 
    type: Date, 
    required: true 
  },
  userId: String
}, {
  timestamps: true
});

export const SkillMapModel = mongoose.model<SkillMap>('SkillMap', skillMapMongooseSchema);

// Request/Response Models
export const SkillMapRequestSchema = z.object({
  skillName: z.string().min(1, "Skill name is required"), // Ensure this matches exactly
  userProfile: z.object({
    userId: z.string(),
    currentSkillLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
    learningStylePreferences: z.array(z.enum(["visual", "auditory", "reading", "kinesthetic"])),
    timeAvailability: z.object({
      hoursPerWeek: z.number(),
      preferredSessionLength: z.number().optional(),
      preferredDays: z.array(z.string()).optional()
    }),
    backgroundKnowledge: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional()
  }),
  learningPreferences: z.object({
    resourceTypes: z.array(z.string()).optional(),
    difficultyProgression: z.string().optional(),
    focusAreas: z.array(z.string()).optional()
  }).optional(),
  timeFrame: z.number().int().positive().optional()
});

export interface SkillMapRequest {
  skillName: string;
  userProfile?: z.infer<typeof UserProfileSchema>;
  learningPreferences?: {
    resourceTypes?: string[];
    difficultyProgression?: string;
    focusAreas?: string[];
  };
  timeFrame?: number;
}

export interface SkillMapResponse {
  skillMap: SkillMap;
  userId?: string;
}