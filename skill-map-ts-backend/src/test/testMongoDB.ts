// src/tests/testMongoDB.ts
import mongoose, { Document } from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { connectToDatabase } from '../config/database';
import User from '../models/User';
import SkillMap, { ISkillMap } from '../models/SkillMap';
import UserProgress from '../models/UserProgress';
import { UserProgressService } from '../services/userProgressService';
import { LearningStyle, SkillLevel } from '../models/dto/SkillMapDto';

// Define a type for Mongoose document with _id
type SkillMapWithId = Document<unknown, {}, ISkillMap> & 
  ISkillMap & 
  { _id: mongoose.Types.ObjectId };

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Test data
const TEST_USER_ID = `test-user-${Date.now()}`;
const TEST_EMAIL = `test-${Date.now()}@example.com`;

// Function to create sample user
async function createTestUser() {
  console.log('\n--- Creating Test User ---');
  
  try {
    const user = new User({
      email: TEST_EMAIL,
      password: 'Test123!@#',
      name: 'Test User',
      user_id: TEST_USER_ID,
      current_skill_level: 'intermediate',
      learning_style_preferences: ['visual', 'reading'],
      time_availability: {
        hours_per_week: 10,
        preferred_session_length: 45,
        preferred_days: ['Monday', 'Wednesday', 'Friday']
      },
      background_knowledge: ['HTML', 'Basic CSS'],
      goals: ['Build a web application', 'Learn modern JS frameworks']
    });
    
    await user.save();
    console.log(`✅ Created test user with ID: ${TEST_USER_ID}`);
    return user;
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  }
}

// Function to create sample skill map
async function createTestSkillMap(userId: string): Promise<SkillMapWithId> {
  console.log('\n--- Creating Test Skill Map ---');
  
  try {
    const skillMap = new SkillMap({
      root_skill: 'JavaScript Development',
      nodes: {
        'js-basics': {
          name: 'JavaScript Fundamentals',
          description: 'Core JavaScript language features and syntax',
          estimated_hours: 15,
          parent_id: null,
          children: ['dom-manipulation', 'es6-features'],
          resources: [
            {
              type: 'course',
              name: 'JavaScript Essentials',
              url: 'https://example.com/js-essentials',
              description: 'Comprehensive JavaScript course for beginners'
            },
            {
              type: 'article',
              name: 'MDN JavaScript Guide',
              url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
              description: 'Official JavaScript documentation'
            }
          ],
          depth: 0,
          progress: 0,
          status: 'not_started'
        },
        'dom-manipulation': {
          name: 'DOM Manipulation',
          description: 'Working with the Document Object Model',
          estimated_hours: 10,
          parent_id: 'js-basics',
          children: ['event-handling'],
          resources: [
            {
              type: 'tutorial',
              name: 'DOM Manipulation Tutorial',
              url: 'https://example.com/dom-tutorial',
              description: 'Hands-on tutorial for DOM manipulation'
            }
          ],
          depth: 1,
          progress: 0,
          status: 'not_started'
        },
        'es6-features': {
          name: 'ES6+ Features',
          description: 'Modern JavaScript features and syntax',
          estimated_hours: 12,
          parent_id: 'js-basics',
          children: ['async-javascript'],
          resources: [
            {
              type: 'video',
              name: 'ES6 in Depth',
              url: 'https://example.com/es6-video',
              description: 'Deep dive into ES6 features'
            }
          ],
          depth: 1,
          progress: 0,
          status: 'not_started'
        },
        'event-handling': {
          name: 'Event Handling',
          description: 'Managing browser and user events',
          estimated_hours: 8,
          parent_id: 'dom-manipulation',
          children: [],
          resources: [
            {
              type: 'practice',
              name: 'Event Handling Exercises',
              url: 'https://example.com/event-exercises',
              description: 'Hands-on exercises for event handling'
            }
          ],
          depth: 2,
          progress: 0,
          status: 'not_started'
        },
        'async-javascript': {
          name: 'Asynchronous JavaScript',
          description: 'Promises, async/await, and more',
          estimated_hours: 14,
          parent_id: 'es6-features',
          children: [],
          resources: [
            {
              type: 'article',
              name: 'Understanding Promises',
              url: 'https://example.com/promises',
              description: 'Comprehensive guide to JavaScript Promises'
            }
          ],
          depth: 2,
          progress: 0,
          status: 'not_started'
        }
      },
      total_estimated_hours: 59,
      expected_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      user_id: userId
    });
    
    await skillMap.save();
    
    // Cast to the type that includes _id
    const typedSkillMap = skillMap as SkillMapWithId;
    console.log(`✅ Created test skill map with ID: ${typedSkillMap._id}`);
    
    return typedSkillMap;
  } catch (error) {
    console.error('❌ Error creating test skill map:', error);
    throw error;
  }
}

// Function to initialize and update progress
async function testProgressTracking(userId: string, skillMapId: string) {
  console.log('\n--- Testing Progress Tracking ---');
  
  try {
    const progressService = new UserProgressService();
    
    // Initialize progress
    console.log('Initializing progress tracking...');
    const initialProgress = await progressService.initializeProgress(userId, skillMapId);
    console.log(`✅ Created progress tracking with ID: ${initialProgress._id}`);
    
    // Update progress for a node
    console.log('Updating progress for a skill node...');
    const updatedProgress = await progressService.updateSkillProgress(
      userId,
      skillMapId,
      'js-basics',
      60, // 60% completion
      180, // 3 hours (180 minutes)
      'Making good progress on fundamentals'
    );
    
    console.log(`✅ Updated progress for node 'js-basics' to ${updatedProgress.skill_progress.get('js-basics')?.completion_percentage}%`);
    
    // Update progress for another node
    console.log('Updating progress for another skill node...');
    await progressService.updateSkillProgress(
      userId,
      skillMapId,
      'dom-manipulation',
      40, // 40% completion
      120, // 2 hours (120 minutes)
      'Learning DOM selection and manipulation'
    );
    
    // Mark a node as complete
    console.log('Completing a skill node...');
    await progressService.updateSkillProgress(
      userId,
      skillMapId,
      'es6-features',
      100, // 100% completion
      720, // 12 hours (720 minutes)
      'Completed all ES6 lessons and exercises'
    );
    
    console.log('✅ Successfully updated progress for multiple nodes');
    
    return updatedProgress;
  } catch (error) {
    console.error('❌ Error testing progress tracking:', error);
    throw error;
  }
}

// Function to test dashboard data retrieval
async function testDashboardData(userId: string) {
  console.log('\n--- Testing Dashboard Data Retrieval ---');
  
  try {
    const progressService = new UserProgressService();
    
    console.log('Retrieving dashboard data...');
    const dashboardData = await progressService.getDashboardData(userId);
    
    console.log('✅ Successfully retrieved dashboard data:');
    console.log(`  - Days Completed: ${dashboardData.days_completed}`);
    console.log(`  - Current Streak: ${dashboardData.streak_days}`);
    console.log(`  - Overall Completion: ${dashboardData.overall_completion_rate.toFixed(2)}%`);
    console.log(`  - Badge Count: ${dashboardData.badge_count}`);
    console.log(`  - Upcoming Skills: ${dashboardData.upcoming_skills.length}`);
    console.log(`  - Skill Categories: ${dashboardData.skill_categories.length}`);
    
    // Print some additional details
    if (dashboardData.upcoming_skills.length > 0) {
      console.log('\nUpcoming Skills:');
      dashboardData.upcoming_skills.forEach(skill => {
        console.log(`  - ${skill.name} (${skill.completion_percentage}% complete)`);
      });
    }
    
    if (dashboardData.skill_categories.length > 0) {
      console.log('\nSkill Categories:');
      dashboardData.skill_categories.forEach(category => {
        console.log(`  - ${category.name}: ${category.count} skills, ${category.completion_percentage}% complete`);
      });
    }
    
    return dashboardData;
  } catch (error) {
    console.error('❌ Error testing dashboard data:', error);
    throw error;
  }
}

// Function to clean up test data
async function cleanupTestData(userId: string, skillMapId: string) {
  console.log('\n--- Cleaning Up Test Data ---');
  
  try {
    // Delete progress data
    await UserProgress.deleteMany({ user_id: userId });
    console.log('✅ Deleted test progress data');
    
    // Delete skill map
    await SkillMap.findByIdAndDelete(skillMapId);
    console.log('✅ Deleted test skill map');
    
    // Delete user
    await User.deleteOne({ user_id: userId });
    console.log('✅ Deleted test user');
    
    console.log('✅ All test data cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
    throw error;
  }
}

// Main test function
async function runMongoDBTest() {
  console.log('=== MONGODB CONNECTION AND MODEL TEST ===');
  console.log(`Connecting to MongoDB at ${process.env.MONGODB_URI}`);
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Create test user
    const user = await createTestUser();
    
    // Create test skill map
    const skillMap = await createTestSkillMap(user.user_id);
    
    // Test progress tracking
    await testProgressTracking(user.user_id, skillMap._id.toString());
    
    // Test dashboard data retrieval
    await testDashboardData(user.user_id);
    
    // Clean up test data
    await cleanupTestData(user.user_id, skillMap._id.toString());
    
    console.log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
}

// Run the test
runMongoDBTest();