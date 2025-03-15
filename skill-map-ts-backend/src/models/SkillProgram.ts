// src/models/SkillProgram.ts
import { Schema, model, Document } from 'mongoose';
import { ISkillResource } from './SkillNode';

// Interface for a daily task
export interface IDailyTask {
  day: number;
  name: string;
  description: string;
  difficulty_level: string;
  estimated_hours: number;
  resources: ISkillResource[];
  progress: number;
  status: string;
}

// Interface for skill program document
export interface ISkillProgram extends Document {
  skill_name: string;                // The main skill name
  description: string;               // Description of the program
  daily_tasks: IDailyTask[];         // Array of daily tasks
  total_hours: number;               // Total hours to complete
  expected_completion_date: Date;    // Expected completion date (30 days from creation)
  user_id?: string;                  // Optional user ID if personalized
  created_at: Date;
  updated_at: Date;
}

// Schema for daily task
const DailyTaskSchema = new Schema<IDailyTask>({
  day: { type: Number, required: true, min: 1, max: 30 },
  name: { type: String, required: true },
  description: { type: String, required: true },
  difficulty_level: { type: String, required: true },
  estimated_hours: { type: Number, required: true, min: 0 },
  resources: { 
    type: [{
      type: { type: String, required: true },
      name: { type: String, required: true },
      url: { type: String },
      description: { type: String }
    }], 
    default: [] 
  },
  progress: { type: Number, required: true, default: 0, min: 0, max: 100 },
  status: { 
    type: String, 
    required: true, 
    default: 'not_started',
    enum: ['not_started', 'in_progress', 'completed'] 
  }
}, { _id: false });

// Schema for skill program
const SkillProgramSchema = new Schema<ISkillProgram>({
  skill_name: { type: String, required: true },
  description: { type: String, required: true },
  daily_tasks: { 
    type: [DailyTaskSchema], 
    required: true,
    validate: {
      validator: function(tasks: IDailyTask[]) {
        // Ensure we have exactly 30 tasks
        return tasks.length === 30;
      },
      message: 'Skill program must have exactly 30 daily tasks'
    }
  },
  total_hours: { type: Number, required: true },
  expected_completion_date: { type: Date, required: true },
  user_id: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Pre-save hook to update the updated_at field
SkillProgramSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Create and export the model
export default model<ISkillProgram>('SkillProgram', SkillProgramSchema);