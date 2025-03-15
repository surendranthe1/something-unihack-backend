// src/api/models/skillNode.ts
import { z } from 'zod';
import mongoose from 'mongoose';
import { SkillResourceSchema } from './skillResource';
import { SkillResource } from './skillResource';

// Zod Schema for Skill Node
export const SkillNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  estimatedHours: z.number().min(0),
  parentId: z.string().optional(),
  children: z.array(z.string()).optional(),
  resources: z.array(SkillResourceSchema).optional(),
  depth: z.number().min(0).default(0),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started')
});

// TypeScript Interface
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  estimatedHours: number;
  parentId?: string;
  children?: string[];
  resources?: SkillResource[];
  depth: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

// Mongoose Schema
const skillNodeMongooseSchema = new mongoose.Schema<SkillNode>({
  id: { 
    type: String, 
    required: true,
    unique: true 
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
}, {
  timestamps: true
});

export const SkillNodeModel = mongoose.model<SkillNode>('SkillNode', skillNodeMongooseSchema);