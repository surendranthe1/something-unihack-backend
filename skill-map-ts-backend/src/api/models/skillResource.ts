// src/api/models/skillResource.ts
import { z } from 'zod';
import mongoose from 'mongoose';

// Zod Schema for Skill Resource
export const SkillResourceSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url().optional(),
  description: z.string().optional()
});

// TypeScript Interface
export interface SkillResource {
  type: string;
  name: string;
  url?: string;
  description?: string;
}

// Mongoose Schema
const skillResourceMongooseSchema = new mongoose.Schema<SkillResource>({
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
}, {
  _id: false // Typically embedded in another document
});

export { skillResourceMongooseSchema };