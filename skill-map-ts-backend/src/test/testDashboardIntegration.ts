// src/tests/testDashboardIntegration.ts
import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase } from '../config/database';
import { UserProgressService } from '../services/userProgressService';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080/api';

/**
 * Test the dashboard API endpoint with a real user
 */
async function testDashboardEndpoint(userId: string) {
  console.log(`Testing dashboard API endpoint for user ${userId}...`);
  
  try {
    // Make API request to dashboard endpoint
    const response = await axios.get(`${API_BASE_URL}/dashboard/${userId}`);
    
    if (response.data.success) {
      console.log('✅ Successfully retrieved dashboard data from API!');
      console.log('Dashboard data summary:');
      console.log(`  - Overall Completion: ${response.data.data.overall_completion_rate.toFixed(2)}%`);
      console.log(`  - Days Completed: ${response.data.data.days_completed} days`);
      console.log(`  - Current Streak: ${response.data.data.streak_days} days`);
      console.log(`  - Badges: ${response.data.data.badge_count}`);
      
      // Check if we have upcoming skills
      if (response.data.data.upcoming_skills.length > 0) {
        console.log('\nUpcoming Skills:');
        response.data.data.upcoming_skills.forEach((skill: any) => {
          console.log(`  - ${skill.name} (${skill.completion_percentage}% complete)`);
        });
      }
      
      // Check if we have skill categories
      if (response.data.data.skill_categories.length > 0) {
        console.log('\nSkill Categories:');
        response.data.data.skill_categories.forEach((category: any) => {
          console.log(`  - ${category.name}: ${category.count} skills, ${category.completion_percentage}% complete`);
        });
      }
      
      return true;
    } else {
      console.error('❌ API request succeeded but returned failure status');
      console.error('Error:', response.data.message);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Failed to retrieve dashboard data from API');
    console.error('Error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test the dashboard data from service
 */
async function testDashboardService(userId: string) {
  console.log(`Testing dashboard service for user ${userId}...`);
  
  try {
    const progressService = new UserProgressService();
    const dashboardData = await progressService.getDashboardData(userId);
    
    console.log('✅ Successfully retrieved dashboard data from service!');
    console.log('Dashboard data summary:');
    console.log(`  - Overall Completion: ${dashboardData.overall_completion_rate.toFixed(2)}%`);
    console.log(`  - Days Completed: ${dashboardData.days_completed} days`);
    console.log(`  - Current Streak: ${dashboardData.streak_days} days`);
    console.log(`  - Badges: ${dashboardData.badge_count}`);
    
    // Check if we have upcoming skills
    if (dashboardData.upcoming_skills.length > 0) {
      console.log('\nUpcoming Skills:');
      dashboardData.upcoming_skills.forEach((skill) => {
        console.log(`  - ${skill.name} (${skill.completion_percentage}% complete)`);
      });
    } else {
      console.log('\nNo upcoming skills found');
    }
    
    // Check if we have skill categories
    if (dashboardData.skill_categories.length > 0) {
      console.log('\nSkill Categories:');
      dashboardData.skill_categories.forEach((category) => {
        console.log(`  - ${category.name}: ${category.count} skills, ${category.completion_percentage}% complete`);
      });
    } else {
      console.log('\nNo skill categories found');
    }
    
    return dashboardData;
  } catch (error) {
    console.error('❌ Failed to retrieve dashboard data from service');
    console.error('Error:', error);
    return null;
  }
}

/**
 * Main function to run the test
 */
async function testDashboardData() {
  if (!process.argv[2]) {
    console.error('Please provide a user ID as an argument: npm run test:dashboard userId');
    process.exit(1);
  }
  
  const userId = process.argv[2];
  
  console.log('=== DASHBOARD DATA INTEGRATION TEST ===');
  
  try {
    // Connect to database
    await connectToDatabase();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test service-level data retrieval
    const serviceData = await testDashboardService(userId);
    
    if (!serviceData) {
      console.log('❌ Service test failed. Skipping API test.');
    } else {
      // Test API endpoint
      await testDashboardEndpoint(userId);
    }
    
    console.log('\n✅ Dashboard integration test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testDashboardData();