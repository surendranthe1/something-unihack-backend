// src/models/UserProgress.ts
import mongoose, { Document, Schema } from 'mongoose';

// Schema for daily progress tracking
const DailyProgressSchema = new Schema({
  date: { type: Date, required: true },
  minutes_spent: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  notes: { type: String }
}, { _id: false });

// Schema for skill node progress
const SkillProgressSchema = new Schema({
  nodeId: { type: String, required: true },
  completion_percentage: { type: Number, default: 0 },
  time_spent: { type: Number, default: 0 }, // in minutes
  started_at: { type: Date },
  completed_at: { type: Date },
  notes: { type: String },
  assessment_results: { type: Schema.Types.Mixed }
}, { _id: false });

// Schema for badges/achievements
const BadgeSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  earnedAt: { type: Date, default: Date.now }
});

// Main UserProgress schema
const UserProgressSchema = new Schema({
  user_id: { 
    type: String, 
    required: true,
    index: true
  },
  skill_map_id: { 
    type: Schema.Types.ObjectId, 
    ref: 'SkillMap',
    required: true
  },
  daily_progress: [DailyProgressSchema],
  skill_progress: {
    type: Map,
    of: SkillProgressSchema,
    default: {}
  },
  badges: [BadgeSchema],
  start_date: { type: Date, required: true },
  last_activity: { type: Date, default: Date.now },
  days_completed: { type: Number, default: 0 },
  streak_days: { type: Number, default: 0 },
  longest_streak: { type: Number, default: 0 },
  overall_completion_rate: { type: Number, default: 0 }, // percentage
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Create compound index for userId and skillMapId
UserProgressSchema.index({ user_id: 1, skill_map_id: 1 }, { unique: true });

// Update updatedAt timestamp before saving
// UserProgressSchema.pre('save', function(next) {
//   this.updatedAt = new Date();
//   next();
// });

// Define interface for UserProgress document
export interface IUserProgress extends Document {
    user_id: string;
    skill_map_id: mongoose.Types.ObjectId;
    daily_progress: Array<{
      date: Date;
      minutes_spent: number;
      completed: boolean;
      notes?: string;
    }>;
    skill_progress: Map<string, {
      node_id: string;
      completion_percentage: number;
      time_spent: number;
      started_at?: Date;
      completed_at?: Date;
      notes?: string;
      assessment_results?: any;
    }>;
    badges: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      earned_at: Date;
    }>;
    start_date: Date;
    last_activity: Date;
    days_completed: number;
    streak_days: number;
    longest_streak: number;
    overall_completion_rate: number;
    created_at: Date;
    updated_at: Date;
  }

// Create and export the model
const UserProgress = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;