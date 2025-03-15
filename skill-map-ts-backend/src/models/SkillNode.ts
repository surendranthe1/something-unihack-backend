// src/models/SkillNode.ts
import { Schema, model, Document, Types } from 'mongoose';

// Interface for a learning resource
export interface ISkillResource {
  type: string;      // e.g., 'book', 'course', 'video'
  name: string;
  url?: string;
  description?: string;
}

// Interface for skill node document
export interface ISkillNode extends Document {
  name: string;               // Name of the skill
  description: string;        // Description of the skill
  estimated_hours: number;    // Estimated time to learn this skill
  parent_id?: string;         // ID of the parent skill (null for root)
  children: string[];         // IDs of child skills
  resources: ISkillResource[]; // Learning resources for this skill
  depth: number;              // Depth in the skill tree (0 = root)
  progress: number;           // Progress as a percentage (0-100)
  status: string;             // 'not_started', 'in_progress', 'completed'
}

// Schema for learning resource
const SkillResourceSchema = new Schema<ISkillResource>({
  type: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String },
  description: { type: String },
}, { _id: false });

// Schema for skill node
const SkillNodeSchema = new Schema<ISkillNode>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  estimated_hours: { type: Number, required: true, min: 0 },
  parent_id: { type: String },
  children: { type: [String], default: [] },
  resources: { type: [SkillResourceSchema], default: [] },
  depth: { type: Number, required: true, default: 0 },
  progress: { type: Number, required: true, default: 0, min: 0, max: 100 },
  status: { 
    type: String, 
    required: true, 
    default: 'not_started',
    enum: ['not_started', 'in_progress', 'completed'] 
  },
}, { timestamps: true });

// Create and export the model
export default model<ISkillNode>('SkillNode', SkillNodeSchema);