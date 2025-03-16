// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
//import bcrypt from 'bcrypt';

// Enum values
export enum SkillLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  READING = 'reading',
  HANDSON = 'hands-on'
}

// Schema for time availability
const TimeAvailabilitySchema = new Schema({
  hours_per_week: { type: Number, required: true },
  preferred_session_length: { type: Number },
  preferred_days: { type: [String] }
}, { _id: false });

// Schema for learning preferences
const LearningPreferencesSchema = new Schema({
  resource_types: { type: [String] },
  difficulty_progression: { type: String },
  focus_areas: { type: [String] }
}, { _id: false });

// Main User schema
const UserSchema = new Schema({
  email: { 
    type: String, 
    //required: true, 
    //unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: { 
    type: String, 
    //required: true,
    minlength: 8,
    select: false // Don't include password by default in query results
  },
  name: { type: String, required: true },
  user_id: { 
    type: String, 
    //required: true, 
    //unique: true,
    index: true
  },
  current_skill_level: { 
    type: String, 
    enum: Object.values(SkillLevel),
    default: SkillLevel.INTERMEDIATE
  },
  learning_style_preferences: {
    type: [String],
    enum: Object.values(LearningStyle),
    default: []
  },
  time_availability: { 
    type: TimeAvailabilitySchema,
    required: true,
    default: { hoursPerWeek: 10 }
  },
  learning_preferences: {
    type: LearningPreferencesSchema,
    default: {}
  },
  background_knowledge: { type: [String], default: [] },
  goals: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Create indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ userId: 1 });

// // Hash password before saving
// UserSchema.pre('save', async function(next) {
//   // Only hash the password if it's modified or new
//   if (!this.isModified('password')) return next();
  
//   try {
//     // Generate salt and hash
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     this.updatedAt = new Date();
//     next();
//   } catch (error: any) {
//     next(error);
//   }
// });

// // Method to check if password is correct
// UserSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// Define interface for User document
export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  user_id: string;
  current_skill_level: SkillLevel;
  learning_style_preferences: LearningStyle[];
  time_availability: {
    hours_per_week: number;
    preferred_session_length?: number;
    preferred_days?: string[];
  };
  learning_preferences: {
    resource_types?: string[];
    difficulty_progression?: string;
    focus_areas?: string[];
  };
  background_knowledge: string[];
  goals: string[];
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Create and export the model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;