const mongoose = require('mongoose');
const User = require('../../../models/User');
const { setupTestDB, cleanupTestDB, clearTestDB, generateTestData, testUtils } = require('../../setup');

describe('User Model', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('User Creation', () => {
    test('should create a valid user', async () => {
      const userData = generateTestData.user();
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.username).toBe(userData.username);
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.role).toBe(userData.role);
      expect(savedUser.curriculum).toBe(userData.curriculum);
      expect(savedUser.level).toBe(userData.level);
      expect(savedUser.created_at).toBeDefined();
      expect(savedUser.updated_at).toBeDefined();
    });

    test('should require username', async () => {
      const userData = generateTestData.user({ username: undefined });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Username is required');
    });

    test('should require email', async () => {
      const userData = generateTestData.user({ email: undefined });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow('Email is required');
    });

    test('should require unique username', async () => {
      const userData1 = generateTestData.user();
      const userData2 = generateTestData.user({ email: 'different@example.com' });
      
      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should require unique email', async () => {
      const userData1 = generateTestData.user();
      const userData2 = generateTestData.user({ username: 'differentuser' });
      
      const user1 = new User(userData1);
      await user1.save();

      const user2 = new User(userData2);
      await expect(user2.save()).rejects.toThrow();
    });

    test('should validate email format', async () => {
      const userData = generateTestData.user({ email: 'invalid-email' });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate role enum', async () => {
      const userData = generateTestData.user({ role: 'invalid_role' });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate curriculum enum', async () => {
      const userData = generateTestData.user({ curriculum: 'invalid_curriculum' });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should set default values', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword123'
      };
      
      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.role).toBe('student');
      expect(savedUser.curriculum).toBe('soroban');
      expect(savedUser.level).toBe(1);
      expect(savedUser.is_active).toBe(true);
      expect(savedUser.profile.total_sessions).toBe(0);
      expect(savedUser.profile.total_exercises).toBe(0);
      expect(savedUser.profile.average_accuracy).toBe(0);
      expect(savedUser.profile.current_streak).toBe(0);
    });
  });

  describe('User Methods', () => {
    let user;

    beforeEach(async () => {
      const userData = generateTestData.user();
      user = new User(userData);
      await user.save();
    });

    test('should update profile statistics', async () => {
      const sessionData = {
        exercises_completed: 10,
        accuracy: 85.5,
        total_time: 300,
        perfect_exercises: 7
      };

      await user.updateProfileStats(sessionData);

      expect(user.profile.total_sessions).toBe(1);
      expect(user.profile.total_exercises).toBe(10);
      expect(user.profile.average_accuracy).toBe(85.5);
      expect(user.profile.total_study_time).toBe(300);
      expect(user.profile.last_session_date).toBeDefined();
    });

    test('should calculate average accuracy correctly', async () => {
      // First session
      await user.updateProfileStats({
        exercises_completed: 10,
        accuracy: 80,
        total_time: 300,
        perfect_exercises: 5
      });

      // Second session
      await user.updateProfileStats({
        exercises_completed: 15,
        accuracy: 90,
        total_time: 400,
        perfect_exercises: 12
      });

      expect(user.profile.total_sessions).toBe(2);
      expect(user.profile.average_accuracy).toBe(85); // (80 + 90) / 2
    });

    test('should update streak correctly', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Set last session to yesterday
      user.profile.last_session_date = yesterday;
      user.profile.current_streak = 5;
      await user.save();

      await user.updateStreak();

      expect(user.profile.current_streak).toBe(6);
      expect(user.profile.longest_streak).toBe(6);
    });

    test('should reset streak if gap is more than one day', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

      user.profile.last_session_date = threeDaysAgo;
      user.profile.current_streak = 10;
      user.profile.longest_streak = 15;
      await user.save();

      await user.updateStreak();

      expect(user.profile.current_streak).toBe(1);
      expect(user.profile.longest_streak).toBe(15); // Should remain unchanged
    });

    test('should not update streak for same day', async () => {
      const today = new Date();
      
      user.profile.last_session_date = today;
      user.profile.current_streak = 7;
      await user.save();

      await user.updateStreak();

      expect(user.profile.current_streak).toBe(7); // Should remain unchanged
    });

    test('should check promotion eligibility', async () => {
      // Set up user with good performance
      user.profile.total_sessions = 20;
      user.profile.average_accuracy = 90;
      user.profile.current_streak = 10;
      await user.save();

      const isEligible = await user.checkPromotionEligibility();

      expect(typeof isEligible).toBe('boolean');
    });

    test('should get learning analytics', async () => {
      // Add some session data
      user.profile.total_sessions = 15;
      user.profile.total_exercises = 150;
      user.profile.average_accuracy = 85;
      user.profile.total_study_time = 4500; // 75 minutes
      await user.save();

      const analytics = await user.getLearningAnalytics();

      expect(analytics).toHaveProperty('total_sessions');
      expect(analytics).toHaveProperty('total_exercises');
      expect(analytics).toHaveProperty('average_accuracy');
      expect(analytics).toHaveProperty('total_study_time');
      expect(analytics).toHaveProperty('exercises_per_session');
      expect(analytics).toHaveProperty('average_session_time');

      expect(analytics.exercises_per_session).toBe(10); // 150/15
      expect(analytics.average_session_time).toBe(300); // 4500/15 seconds
    });

    test('should format user for response', async () => {
      const formattedUser = user.toResponseFormat();

      expect(formattedUser).toHaveProperty('id');
      expect(formattedUser).toHaveProperty('username');
      expect(formattedUser).toHaveProperty('email');
      expect(formattedUser).toHaveProperty('display_name');
      expect(formattedUser).toHaveProperty('role');
      expect(formattedUser).toHaveProperty('curriculum');
      expect(formattedUser).toHaveProperty('level');
      expect(formattedUser).toHaveProperty('profile');
      expect(formattedUser).toHaveProperty('preferences');
      expect(formattedUser).toHaveProperty('created_at');
      expect(formattedUser).not.toHaveProperty('password');
      expect(formattedUser).not.toHaveProperty('__v');
    });
  });

  describe('User Validation', () => {
    test('should validate username length', async () => {
      const userData = generateTestData.user({ username: 'ab' }); // Too short
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate username characters', async () => {
      const userData = generateTestData.user({ username: 'user@name!' }); // Invalid characters
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate level range', async () => {
      const userData = generateTestData.user({ level: 0 }); // Below minimum
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate age group format', async () => {
      const userData = generateTestData.user({ age_group: 'invalid' });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });

    test('should validate preferences structure', async () => {
      const userData = generateTestData.user({
        preferences: {
          language: 'invalid_language',
          difficulty_preference: 'invalid_difficulty'
        }
      });
      const user = new User(userData);

      await expect(user.save()).rejects.toThrow();
    });
  });

  describe('User Queries', () => {
    beforeEach(async () => {
      // Create multiple test users
      const users = [
        generateTestData.user({ username: 'user1', email: 'user1@test.com', curriculum: 'soroban', level: 1 }),
        generateTestData.user({ username: 'user2', email: 'user2@test.com', curriculum: 'vedic', level: 2 }),
        generateTestData.user({ username: 'user3', email: 'user3@test.com', curriculum: 'soroban', level: 3 }),
        generateTestData.user({ username: 'user4', email: 'user4@test.com', curriculum: 'logic', level: 1, role: 'trainer' })
      ];

      await User.insertMany(users);
    });

    test('should find users by curriculum', async () => {
      const sorobanUsers = await User.find({ curriculum: 'soroban' });
      expect(sorobanUsers).toHaveLength(2);
    });

    test('should find users by level', async () => {
      const level1Users = await User.find({ level: 1 });
      expect(level1Users).toHaveLength(2);
    });

    test('should find users by role', async () => {
      const trainers = await User.find({ role: 'trainer' });
      expect(trainers).toHaveLength(1);
      
      const students = await User.find({ role: 'student' });
      expect(students).toHaveLength(3);
    });

    test('should find active users', async () => {
      const activeUsers = await User.find({ is_active: true });
      expect(activeUsers).toHaveLength(4);
    });

    test('should sort users by creation date', async () => {
      const users = await User.find().sort({ created_at: -1 });
      expect(users).toHaveLength(4);
      
      // Check if sorted in descending order
      for (let i = 1; i < users.length; i++) {
        expect(users[i-1].created_at.getTime()).toBeGreaterThanOrEqual(users[i].created_at.getTime());
      }
    });
  });

  describe('User Indexing', () => {
    test('should have proper indexes', async () => {
      const indexes = await User.collection.getIndexes();
      
      // Check for username index
      expect(indexes).toHaveProperty('username_1');
      
      // Check for email index
      expect(indexes).toHaveProperty('email_1');
      
      // Check for compound indexes if any
      const indexNames = Object.keys(indexes);
      expect(indexNames.length).toBeGreaterThan(2); // At least _id, username, email
    });
  });

  describe('User Middleware', () => {
    test('should hash password before saving', async () => {
      const userData = generateTestData.user({ password: 'plaintext123' });
      const user = new User(userData);
      await user.save();

      expect(user.password).not.toBe('plaintext123');
      expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('should update updated_at on save', async () => {
      const userData = generateTestData.user();
      const user = new User(userData);
      await user.save();
      
      const originalUpdatedAt = user.updated_at;
      
      // Wait a bit and update
      await testUtils.wait(100);
      user.display_name = 'Updated Name';
      await user.save();

      expect(user.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('User Edge Cases', () => {
    test('should handle very long study sessions', async () => {
      const userData = generateTestData.user();
      const user = new User(userData);
      await user.save();

      const sessionData = {
        exercises_completed: 1000,
        accuracy: 95.5,
        total_time: 36000, // 10 hours
        perfect_exercises: 950
      };

      await user.updateProfileStats(sessionData);

      expect(user.profile.total_exercises).toBe(1000);
      expect(user.profile.total_study_time).toBe(36000);
    });

    test('should handle zero accuracy sessions', async () => {
      const userData = generateTestData.user();
      const user = new User(userData);
      await user.save();

      const sessionData = {
        exercises_completed: 5,
        accuracy: 0,
        total_time: 300,
        perfect_exercises: 0
      };

      await user.updateProfileStats(sessionData);

      expect(user.profile.average_accuracy).toBe(0);
    });

    test('should handle perfect accuracy sessions', async () => {
      const userData = generateTestData.user();
      const user = new User(userData);
      await user.save();

      const sessionData = {
        exercises_completed: 10,
        accuracy: 100,
        total_time: 300,
        perfect_exercises: 10
      };

      await user.updateProfileStats(sessionData);

      expect(user.profile.average_accuracy).toBe(100);
    });
  });
});
