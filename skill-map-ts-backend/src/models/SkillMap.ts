// src/models/SkillMap.ts
import { Schema, model, Document, Types } from 'mongoose';
import { ISkillNode } from './SkillNode';

// Interface for skill map document
export interface ISkillMap extends Document {
  
  root_skill: string;                // The main skill name
  nodes: Record<string, ISkillNode>; // Dictionary of id -> node
  total_estimated_hours: number;     // Total hours to complete
  expected_completion_date: Date;    // Expected completion date
  user_id?: string;                  // Optional user ID if personalized
  created_at: Date;
  updated_at: Date;
}

// Schema for skill map
const SkillMapSchema = new Schema<ISkillMap>({
  root_skill: { type: String, required: true },
  nodes: { 
    type: Schema.Types.Mixed, 
    required: true,
    validate: {
      validator: function(nodes: Record<string, any>) {
        // Basic validation - ensure nodes is an object
        return typeof nodes === 'object' && nodes !== null;
      },
      message: 'Nodes must be a valid object of skill nodes'
    }
  },
  total_estimated_hours: { type: Number, required: true },
  expected_completion_date: { type: Date, required: true },
  user_id: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Pre-save hook to update the updated_at field
SkillMapSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Create and export the model
export default model<ISkillMap>('SkillMap', SkillMapSchema);