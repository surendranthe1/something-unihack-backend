// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

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
  hoursPerWeek: { type: Number, required: true },
  preferredSessionLength: { type: Number },
  preferredDays: { type: [String] }
}, { _id: false });

// Schema for learning preferences
const LearningPreferencesSchema = new Schema({
  resourceTypes: { type: [String] },
  difficultyProgression: { type: String },
  focusAreas: { type: [String] }
}, { _id: false });

// Main User schema
const UserSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.']
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8,
    select: false // Don't include password by default in query results
  },
  name: { type: String, required: true },
  userId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true
  },
  currentSkillLevel: { 
    type: String, 
    enum: Object.values(SkillLevel),
    default: SkillLevel.BEGINNER
  },
  learningStylePreferences: {
    type: [String],
    enum: Object.values(LearningStyle),
    default: []
  },
  timeAvailability: { 
    type: TimeAvailabilitySchema,
    required: true,
    default: { hoursPerWeek: 10 }
  },
  learningPreferences: {
    type: LearningPreferencesSchema,
    default: {}
  },
  backgroundKnowledge: { type: [String], default: [] },
  goals: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Create indexes for efficient queries
UserSchema.index({ email: 1 });
UserSchema.index({ userId: 1 });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = new Date();
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to check if password is correct
UserSchema.methods.matchPassword = async function(enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Define interface for User document
export interface UserDocument extends Document {
  email: string;
  password: string;
  name: string;
  userId: string;
  currentSkillLevel: SkillLevel;
  learningStylePreferences: LearningStyle[];
  timeAvailability: {
    hoursPerWeek: number;
    preferredSessionLength?: number;
    preferredDays?: string[];
  };
  learningPreferences: {
    resourceTypes?: string[];
    difficultyProgression?: string;
    focusAreas?: string[];
  };
  backgroundKnowledge: string[];
  goals: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

// Create and export the model
const User = mongoose.model<UserDocument>('User', UserSchema);

export default User;