// src/api/models/progress.ts
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod Schema for Progress Data
export const ProgressDataSchema = z.object({
  nodeId: z.string().min(1),
  completionPercentage: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
  notes: z.string().optional(),
  assessmentResults: z.record(z.string(), z.any()).optional()
});

// TypeScript Interface for Progress Data
export interface ProgressData {
  nodeId: string;
  completionPercentage: number;
  timeSpent: number;
  notes?: string;
  assessmentResults?: Record<string, any>;
}

// Zod Schema for Context Change
export const ContextChangeSchema = z.object({
  changeType: z.string().min(1),
  description: z.string().min(1),
  impactFactor: z.number().min(-1).max(1),
  affectedPeriod: z.object({
    start: z.date(),
    end: z.date()
  })
});

// TypeScript Interface for Context Change
export interface ContextChange {
  changeType: string;
  description: string;
  impactFactor: number;
  affectedPeriod: {
    start: Date;
    end: Date;
  };
}

// Mongoose Schema for Progress Data
const progressDataMongooseSchema = new mongoose.Schema<ProgressData>({
  nodeId: { 
    type: String, 
    required: true 
  },
  completionPercentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100 
  },
  timeSpent: { 
    type: Number, 
    required: true,
    min: 0 
  },
  notes: String,
  assessmentResults: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Mongoose Schema for Context Change
const contextChangeMongooseSchema = new mongoose.Schema<ContextChange>({
  changeType: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  impactFactor: { 
    type: Number, 
    required: true,
    min: -1,
    max: 1 
  },
  affectedPeriod: {
    start: { 
      type: Date, 
      required: true 
    },
    end: { 
      type: Date, 
      required: true 
    }
  }
}, {
  timestamps: true
});

// Request/Response Models
export const ProgressUpdateRequestSchema = z.object({
  userId: z.string().min(1),
  skillMapId: z.string().min(1),
  progressData: z.array(ProgressDataSchema),
  contextChanges: z.array(ContextChangeSchema).optional()
});

export interface ProgressUpdateRequest {
  userId: string;
  skillMapId: string;
  progressData: ProgressData[];
  contextChanges?: ContextChange[];
}

export const ProgressUpdateResponseSchema = z.object({
  updatedSkillMap: z.any(), // Reference to SkillMapSchema
  userId: z.string(),
  skillMapId: z.string(),
  adjustmentSummary: z.string().optional()
});

export interface ProgressUpdateResponse {
  updatedSkillMap: any; // Reference to SkillMap
  userId: string;
  skillMapId: string;
  adjustmentSummary?: string;
}

// Create Mongoose Models
export const ProgressDataModel = mongoose.model<ProgressData>('ProgressData', progressDataMongooseSchema);
export const ContextChangeModel = mongoose.model<ContextChange>('ContextChange', contextChangeMongooseSchema);