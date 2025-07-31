const mongoose = require('mongoose');
const Session = require('../../../models/Session');
const User = require('../../../models/User');
const { setupTestDB, cleanupTestDB, clearTestDB, generateTestData, testUtils } = require('../../setup');

describe('Session Model', () => {
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create a test user for sessions
    const userData = generateTestData.user();
    testUser = new User(userData);
    await testUser.save();
  });

  describe('Session Creation', () => {
    test('should create a valid session', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      const savedSession = await session.save();

      expect(savedSession._id).toBeDefined();
      expect(savedSession.user_id.toString()).toBe(testUser._id.toString());
      expect(savedSession.curriculum).toBe(sessionData.curriculum);
      expect(savedSession.level).toBe(sessionData.level);
      expect(savedSession.status).toBe(sessionData.status);
      expect(savedSession.created_at).toBeDefined();
      expect(savedSession.updated_at).toBeDefined();
    });

    test('should require user_id', async () => {
      const sessionData = generateTestData.session(null);
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should require curriculum', async () => {
      const sessionData = generateTestData.session(testUser._id, { curriculum: undefined });
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should validate curriculum enum', async () => {
      const sessionData = generateTestData.session(testUser._id, { curriculum: 'invalid_curriculum' });
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should validate session_type enum', async () => {
      const sessionData = generateTestData.session(testUser._id, { session_type: 'invalid_type' });
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should validate status enum', async () => {
      const sessionData = generateTestData.session(testUser._id, { status: 'invalid_status' });
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should set default values', async () => {
      const sessionData = {
        user_id: testUser._id,
        curriculum: 'soroban',
        level: 1
      };
      
      const session = new Session(sessionData);
      const savedSession = await session.save();

      expect(savedSession.session_type).toBe('practice');
      expect(savedSession.status).toBe('active');
      expect(savedSession.exercises).toEqual([]);
      expect(savedSession.settings.difficulty).toBe('medium');
      expect(savedSession.settings.exercise_count).toBe(10);
      expect(savedSession.settings.hints_enabled).toBe(true);
    });
  });

  describe('Session Methods', () => {
    let session;

    beforeEach(async () => {
      const sessionData = generateTestData.session(testUser._id);
      session = new Session(sessionData);
      await session.save();
    });

    test('should add exercise to session', async () => {
      const exerciseData = {
        exercise_id: 'test_exercise_1',
        question: '5 + 3 = ?',
        correct_answer: '8',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      expect(session.exercises).toHaveLength(1);
      expect(session.exercises[0].exercise_id).toBe(exerciseData.exercise_id);
      expect(session.exercises[0].question).toBe(exerciseData.question);
      expect(session.exercises[0].correct_answer).toBe(exerciseData.correct_answer);
    });

    test('should submit answer for exercise', async () => {
      // First add an exercise
      const exerciseData = {
        exercise_id: 'test_exercise_1',
        question: '5 + 3 = ?',
        correct_answer: '8',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      // Submit answer
      const result = await session.submitAnswer(0, '8', 15000); // 15 seconds

      expect(result.is_correct).toBe(true);
      expect(session.exercises[0].user_answer).toBe('8');
      expect(session.exercises[0].is_correct).toBe(true);
      expect(session.exercises[0].time_taken).toBe(15000);
      expect(session.exercises[0].answered_at).toBeDefined();
    });

    test('should handle incorrect answer', async () => {
      const exerciseData = {
        exercise_id: 'test_exercise_1',
        question: '5 + 3 = ?',
        correct_answer: '8',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      const result = await session.submitAnswer(0, '7', 20000);

      expect(result.is_correct).toBe(false);
      expect(session.exercises[0].user_answer).toBe('7');
      expect(session.exercises[0].is_correct).toBe(false);
      expect(session.exercises[0].time_taken).toBe(20000);
    });

    test('should skip exercise', async () => {
      const exerciseData = {
        exercise_id: 'test_exercise_1',
        question: '5 + 3 = ?',
        correct_answer: '8',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      await session.skipExercise(0);

      expect(session.exercises[0].skipped).toBe(true);
      expect(session.exercises[0].skipped_at).toBeDefined();
    });

    test('should use hint for exercise', async () => {
      const exerciseData = {
        exercise_id: 'test_exercise_1',
        question: '5 + 3 = ?',
        correct_answer: '8',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      await session.useHint(0);

      expect(session.exercises[0].hints_used).toBe(1);
    });

    test('should calculate session statistics', async () => {
      // Add multiple exercises with answers
      const exercises = [
        { exercise_id: 'ex1', question: '2+2=?', correct_answer: '4', user_answer: '4', is_correct: true, time_taken: 5000 },
        { exercise_id: 'ex2', question: '3+3=?', correct_answer: '6', user_answer: '6', is_correct: true, time_taken: 7000 },
        { exercise_id: 'ex3', question: '4+4=?', correct_answer: '8', user_answer: '7', is_correct: false, time_taken: 10000 },
        { exercise_id: 'ex4', question: '5+5=?', correct_answer: '10', user_answer: null, is_correct: null, skipped: true }
      ];

      for (const ex of exercises) {
        await session.addExercise(ex);
      }

      const stats = session.calculateStats();

      expect(stats.total_exercises).toBe(4);
      expect(stats.completed_exercises).toBe(3);
      expect(stats.correct_answers).toBe(2);
      expect(stats.incorrect_answers).toBe(1);
      expect(stats.skipped_exercises).toBe(1);
      expect(stats.accuracy_rate).toBe(66.67); // 2/3 * 100
      expect(stats.average_time).toBe(7333.33); // (5000+7000+10000)/3
    });

    test('should complete session', async () => {
      // Add some exercises
      const exercises = [
        { exercise_id: 'ex1', question: '2+2=?', correct_answer: '4', user_answer: '4', is_correct: true, time_taken: 5000 },
        { exercise_id: 'ex2', question: '3+3=?', correct_answer: '6', user_answer: '6', is_correct: true, time_taken: 7000 }
      ];

      for (const ex of exercises) {
        await session.addExercise(ex);
      }

      await session.completeSession();

      expect(session.status).toBe('completed');
      expect(session.end_time).toBeDefined();
      expect(session.results).toBeDefined();
      expect(session.results.total_exercises).toBe(2);
      expect(session.results.accuracy_rate).toBe(100);
    });

    test('should pause and resume session', async () => {
      await session.pauseSession();
      expect(session.status).toBe('paused');

      await session.resumeSession();
      expect(session.status).toBe('active');
    });

    test('should abandon session', async () => {
      await session.abandonSession();
      expect(session.status).toBe('abandoned');
      expect(session.end_time).toBeDefined();
    });

    test('should get session duration', async () => {
      const startTime = new Date();
      session.start_time = startTime;
      session.end_time = new Date(startTime.getTime() + 300000); // 5 minutes later

      const duration = session.getDuration();
      expect(duration).toBe(300000); // 5 minutes in milliseconds
    });

    test('should check if session is expired', async () => {
      // Set session to expire in the past
      session.start_time = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      session.settings.time_limit = 3600; // 1 hour limit

      const isExpired = session.isExpired();
      expect(isExpired).toBe(true);
    });

    test('should format session for response', async () => {
      const formattedSession = session.toResponseFormat();

      expect(formattedSession).toHaveProperty('id');
      expect(formattedSession).toHaveProperty('user_id');
      expect(formattedSession).toHaveProperty('curriculum');
      expect(formattedSession).toHaveProperty('level');
      expect(formattedSession).toHaveProperty('status');
      expect(formattedSession).toHaveProperty('exercises');
      expect(formattedSession).toHaveProperty('settings');
      expect(formattedSession).toHaveProperty('created_at');
      expect(formattedSession).not.toHaveProperty('__v');
    });
  });

  describe('Session Validation', () => {
    test('should validate level range', async () => {
      const sessionData = generateTestData.session(testUser._id, { level: 0 });
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should validate settings structure', async () => {
      const sessionData = generateTestData.session(testUser._id, {
        settings: {
          difficulty: 'invalid_difficulty',
          exercise_count: -1
        }
      });
      const session = new Session(sessionData);

      await expect(session.save()).rejects.toThrow();
    });

    test('should validate exercise structure', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      // Try to add invalid exercise
      const invalidExercise = {
        // Missing required fields
        question: '2+2=?'
      };

      await expect(session.addExercise(invalidExercise)).rejects.toThrow();
    });
  });

  describe('Session Queries', () => {
    beforeEach(async () => {
      // Create multiple test sessions
      const sessions = [
        generateTestData.session(testUser._id, { curriculum: 'soroban', level: 1, status: 'completed' }),
        generateTestData.session(testUser._id, { curriculum: 'vedic', level: 2, status: 'active' }),
        generateTestData.session(testUser._id, { curriculum: 'soroban', level: 1, status: 'paused' }),
        generateTestData.session(testUser._id, { curriculum: 'logic', level: 3, status: 'completed' })
      ];

      await Session.insertMany(sessions);
    });

    test('should find sessions by user', async () => {
      const userSessions = await Session.find({ user_id: testUser._id });
      expect(userSessions).toHaveLength(4);
    });

    test('should find sessions by curriculum', async () => {
      const sorobanSessions = await Session.find({ curriculum: 'soroban' });
      expect(sorobanSessions).toHaveLength(2);
    });

    test('should find sessions by status', async () => {
      const completedSessions = await Session.find({ status: 'completed' });
      expect(completedSessions).toHaveLength(2);
      
      const activeSessions = await Session.find({ status: 'active' });
      expect(activeSessions).toHaveLength(1);
    });

    test('should find sessions by level', async () => {
      const level1Sessions = await Session.find({ level: 1 });
      expect(level1Sessions).toHaveLength(2);
    });

    test('should sort sessions by creation date', async () => {
      const sessions = await Session.find().sort({ created_at: -1 });
      expect(sessions).toHaveLength(4);
      
      // Check if sorted in descending order
      for (let i = 1; i < sessions.length; i++) {
        expect(sessions[i-1].created_at.getTime()).toBeGreaterThanOrEqual(sessions[i].created_at.getTime());
      }
    });
  });

  describe('Session Performance', () => {
    test('should handle large number of exercises', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      // Add 100 exercises
      for (let i = 0; i < 100; i++) {
        const exerciseData = {
          exercise_id: `exercise_${i}`,
          question: `${i} + ${i} = ?`,
          correct_answer: (i * 2).toString(),
          user_answer: (i * 2).toString(),
          is_correct: true,
          time_taken: 5000 + (i * 100),
          hints_used: 0,
          skipped: false,
          presented_at: new Date()
        };

        await session.addExercise(exerciseData);
      }

      expect(session.exercises).toHaveLength(100);

      const stats = session.calculateStats();
      expect(stats.total_exercises).toBe(100);
      expect(stats.accuracy_rate).toBe(100);
    });

    test('should calculate statistics efficiently', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      // Add exercises with varying performance
      for (let i = 0; i < 50; i++) {
        const isCorrect = i % 3 !== 0; // 2/3 correct
        const exerciseData = {
          exercise_id: `exercise_${i}`,
          question: `${i} + 1 = ?`,
          correct_answer: (i + 1).toString(),
          user_answer: isCorrect ? (i + 1).toString() : '0',
          is_correct: isCorrect,
          time_taken: 3000 + (i * 50),
          hints_used: i % 5 === 0 ? 1 : 0,
          skipped: false,
          presented_at: new Date()
        };

        await session.addExercise(exerciseData);
      }

      const startTime = Date.now();
      const stats = session.calculateStats();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
      expect(stats.total_exercises).toBe(50);
      expect(Math.round(stats.accuracy_rate)).toBe(67); // ~66.67%
    });
  });

  describe('Session Edge Cases', () => {
    test('should handle empty session completion', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      await session.completeSession();

      expect(session.status).toBe('completed');
      expect(session.results.total_exercises).toBe(0);
      expect(session.results.accuracy_rate).toBe(0);
    });

    test('should handle session with only skipped exercises', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      // Add skipped exercises
      for (let i = 0; i < 5; i++) {
        const exerciseData = {
          exercise_id: `exercise_${i}`,
          question: `${i} + 1 = ?`,
          correct_answer: (i + 1).toString(),
          user_answer: null,
          is_correct: null,
          time_taken: null,
          hints_used: 0,
          skipped: true,
          presented_at: new Date(),
          skipped_at: new Date()
        };

        await session.addExercise(exerciseData);
      }

      const stats = session.calculateStats();
      expect(stats.total_exercises).toBe(5);
      expect(stats.completed_exercises).toBe(0);
      expect(stats.skipped_exercises).toBe(5);
      expect(stats.accuracy_rate).toBe(0);
    });

    test('should handle very fast answers', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      const exerciseData = {
        exercise_id: 'fast_exercise',
        question: '1 + 1 = ?',
        correct_answer: '2',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      // Submit very fast answer (100ms)
      const result = await session.submitAnswer(0, '2', 100);

      expect(result.is_correct).toBe(true);
      expect(session.exercises[0].time_taken).toBe(100);
    });

    test('should handle very slow answers', async () => {
      const sessionData = generateTestData.session(testUser._id);
      const session = new Session(sessionData);
      await session.save();

      const exerciseData = {
        exercise_id: 'slow_exercise',
        question: '1 + 1 = ?',
        correct_answer: '2',
        user_answer: null,
        is_correct: null,
        time_taken: null,
        hints_used: 0,
        skipped: false,
        presented_at: new Date()
      };

      await session.addExercise(exerciseData);

      // Submit very slow answer (5 minutes)
      const result = await session.submitAnswer(0, '2', 300000);

      expect(result.is_correct).toBe(true);
      expect(session.exercises[0].time_taken).toBe(300000);
    });
  });
});
