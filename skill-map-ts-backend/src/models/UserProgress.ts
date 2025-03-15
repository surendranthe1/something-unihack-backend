// src/models/UserProgress.ts
import mongoose, { Document, Schema } from 'mongoose';

// Schema for daily progress tracking
const DailyProgressSchema = new Schema({
  date: { type: Date, required: true },
  minutesSpent: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  notes: { type: String }
}, { _id: false });

// Schema for skill node progress
const SkillProgressSchema = new Schema({
  nodeId: { type: String, required: true },
  completionPercentage: { type: Number, default: 0 },
  timeSpent: { type: Number, default: 0 }, // in minutes
  startedAt: { type: Date },
  completedAt: { type: Date },
  notes: { type: String },
  assessmentResults: { type: Schema.Types.Mixed }
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
  userId: { 
    type: String, 
    required: true,
    index: true
  },
  skillMapId: { 
    type: Schema.Types.ObjectId, 
    ref: 'SkillMap',
    required: true
  },
  dailyProgress: [DailyProgressSchema],
  skillProgress: {
    type: Map,
    of: SkillProgressSchema,
    default: {}
  },
  badges: [BadgeSchema],
  startDate: { type: Date, required: true },
  lastActivity: { type: Date, default: Date.now },
  daysCompleted: { type: Number, default: 0 },
  streakDays: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  overallCompletionRate: { type: Number, default: 0 }, // percentage
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound index for userId and skillMapId
UserProgressSchema.index({ userId: 1, skillMapId: 1 }, { unique: true });

// Update updatedAt timestamp before saving
UserProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Define interface for UserProgress document
export interface UserProgressDocument extends Document {
  userId: string;
  skillMapId: mongoose.Types.ObjectId;
  dailyProgress: Array<{
    date: Date;
    minutesSpent: number;
    completed: boolean;
    notes?: string;
  }>;
  skillProgress: Map<string, {
    nodeId: string;
    completionPercentage: number;
    timeSpent: number;
    startedAt?: Date;
    completedAt?: Date;
    notes?: string;
    assessmentResults?: any;
  }>;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    earnedAt: Date;
  }>;
  startDate: Date;
  lastActivity: Date;
  daysCompleted: number;
  streakDays: number;
  longestStreak: number;
  overallCompletionRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// Create and export the model
const UserProgress = mongoose.model<UserProgressDocument>('UserProgress', UserProgressSchema);

export default UserProgress;