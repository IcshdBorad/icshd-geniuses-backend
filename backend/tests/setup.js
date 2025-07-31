const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config({ path: '.env.test' });

let mongoServer;

// Setup test database
const setupTestDB = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Test database connected successfully');
  } catch (error) {
    console.error('❌ Test database connection failed:', error);
    process.exit(1);
  }
};

// Cleanup test database
const cleanupTestDB = async () => {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    console.log('✅ Test database cleaned up successfully');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
  }
};

// Clear all collections between tests
const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('❌ Failed to clear test database:', error);
  }
};

// Create test user
const createTestUser = async () => {
  const User = require('../models/User');
  
  const testUser = new User({
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword123',
    display_name: 'Test User',
    role: 'student',
    curriculum: 'soroban',
    level: 1,
    age_group: '8-10',
    preferences: {
      language: 'ar',
      difficulty_preference: 'adaptive',
      session_duration: 15
    },
    profile: {
      total_sessions: 0,
      total_exercises: 0,
      average_accuracy: 0,
      average_speed: 0,
      current_streak: 0,
      longest_streak: 0,
      total_study_time: 0,
      last_session_date: null
    }
  });
  
  return await testUser.save();
};

// Create test session
const createTestSession = async (userId) => {
  const Session = require('../models/Session');
  
  const testSession = new Session({
    user_id: userId,
    curriculum: 'soroban',
    level: 1,
    session_type: 'practice',
    exercises: [],
    status: 'active',
    settings: {
      difficulty: 'medium',
      exercise_count: 10,
      time_limit: 900,
      hints_enabled: true,
      skip_enabled: true
    },
    start_time: new Date(),
    metadata: {
      device_type: 'desktop',
      browser: 'chrome',
      ip_address: '127.0.0.1'
    }
  });
  
  return await testSession.save();
};

// Create test exercise
const createTestExercise = async () => {
  const Exercise = require('../models/Exercise');
  
  const testExercise = new Exercise({
    id: 'test_exercise_1',
    curriculum: 'soroban',
    level: 1,
    category: 'addition',
    subcategory: 'basic',
    difficulty: 'easy',
    name: {
      ar: 'تمرين جمع أساسي',
      en: 'Basic Addition Exercise'
    },
    description: {
      ar: 'تمرين جمع بسيط للمبتدئين',
      en: 'Simple addition exercise for beginners'
    },
    pattern: {
      type: 'arithmetic',
      operation: 'addition',
      operands: {
        count: 2,
        range: { min: 1, max: 10 }
      },
      constraints: {
        max_result: 20,
        no_carry: true
      }
    },
    metadata: {
      estimated_time: 30,
      cognitive_load: 'low',
      prerequisite_skills: ['number_recognition', 'basic_counting']
    },
    usage_stats: {
      total_attempts: 0,
      success_rate: 0,
      average_time: 0,
      difficulty_rating: 2.5
    }
  });
  
  return await testExercise.save();
};

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = {
    id: req.testUserId || 'test-user-id',
    role: 'student',
    username: 'testuser'
  };
  next();
};

// Mock admin authentication middleware
const mockAdminAuth = (req, res, next) => {
  req.user = {
    id: 'test-admin-id',
    role: 'admin',
    username: 'testadmin'
  };
  next();
};

// Test data generators
const generateTestData = {
  user: (overrides = {}) => ({
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword123',
    display_name: 'Test User',
    role: 'student',
    curriculum: 'soroban',
    level: 1,
    age_group: '8-10',
    ...overrides
  }),
  
  session: (userId, overrides = {}) => ({
    user_id: userId,
    curriculum: 'soroban',
    level: 1,
    session_type: 'practice',
    exercises: [],
    status: 'active',
    settings: {
      difficulty: 'medium',
      exercise_count: 10,
      time_limit: 900,
      hints_enabled: true,
      skip_enabled: true
    },
    start_time: new Date(),
    ...overrides
  }),
  
  exercise: (overrides = {}) => ({
    id: 'test_exercise_1',
    curriculum: 'soroban',
    level: 1,
    category: 'addition',
    subcategory: 'basic',
    difficulty: 'easy',
    name: {
      ar: 'تمرين جمع أساسي',
      en: 'Basic Addition Exercise'
    },
    description: {
      ar: 'تمرين جمع بسيط للمبتدئين',
      en: 'Simple addition exercise for beginners'
    },
    pattern: {
      type: 'arithmetic',
      operation: 'addition',
      operands: {
        count: 2,
        range: { min: 1, max: 10 }
      }
    },
    ...overrides
  }),
  
  achievement: (overrides = {}) => ({
    id: 'test_achievement_1',
    name: {
      ar: 'إنجاز تجريبي',
      en: 'Test Achievement'
    },
    description: {
      ar: 'وصف الإنجاز التجريبي',
      en: 'Test achievement description'
    },
    category: 'accuracy',
    type: 'bronze',
    criteria: {
      metric: 'exercises_completed',
      threshold: 10,
      timeframe: null
    },
    rewards: {
      points: 100,
      experience: 50,
      items: {}
    },
    ...overrides
  }),
  
  challenge: (overrides = {}) => ({
    id: 'test_challenge_1',
    name: {
      ar: 'تحدي تجريبي',
      en: 'Test Challenge'
    },
    description: {
      ar: 'وصف التحدي التجريبي',
      en: 'Test challenge description'
    },
    type: 'daily',
    difficulty: 'easy',
    duration: {
      start_date: new Date(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    objectives: [
      {
        id: 'obj1',
        description: {
          ar: 'أكمل 5 تمارين',
          en: 'Complete 5 exercises'
        },
        target_value: 5,
        metric: 'exercises_completed'
      }
    ],
    rewards: {
      points: 200,
      experience: 100,
      items: {}
    },
    ...overrides
  })
};

// Test utilities
const testUtils = {
  // Wait for a specified time
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random string
  randomString: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Generate random number in range
  randomNumber: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  
  // Generate random date
  randomDate: (start = new Date(2024, 0, 1), end = new Date()) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  },
  
  // Validate object structure
  validateStructure: (obj, expectedKeys) => {
    const objKeys = Object.keys(obj);
    return expectedKeys.every(key => objKeys.includes(key));
  },
  
  // Deep clone object
  deepClone: (obj) => JSON.parse(JSON.stringify(obj))
};

module.exports = {
  setupTestDB,
  cleanupTestDB,
  clearTestDB,
  createTestUser,
  createTestSession,
  createTestExercise,
  mockAuth,
  mockAdminAuth,
  generateTestData,
  testUtils
};
