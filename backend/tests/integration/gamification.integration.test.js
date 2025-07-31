const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server'); // تأكد من أن هذا المسار صحيح لملف server.js الخاص بك
const {
  Achievement,
  UserAchievement,
  PointsTransaction,
  Streak,
  Challenge,
  UserChallenge,
  Leaderboard,
  UserGamificationProfile
} = require('../../models/Gamification'); // استيراد جميع النماذج من ملف Gamification.js الموحد
const User = require('../../models/User'); // Assuming you have a User model
const Session = require('../../models/Session'); // Assuming you have a Session model

let userToken;
let userId;
let mockAchievementId;
let mockChallengeId;

beforeAll(async () => {
  // Connect to a test database
  const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/gamificationTestDB';
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Clear the database before tests
  await Achievement.deleteMany({});
  await UserAchievement.deleteMany({});
  await PointsTransaction.deleteMany({});
  await Streak.deleteMany({});
  await Challenge.deleteMany({});
  await UserChallenge.deleteMany({});
  await Leaderboard.deleteMany({});
  await UserGamificationProfile.deleteMany({});
  await User.deleteMany({});
  await Session.deleteMany({});

  // Register a test user and get a token
  const registerRes = await request(app)
    .post('/api/auth/register') // Adjust to your actual register endpoint
    .send({
      username: 'testuser_gamification',
      email: 'test_gamification@example.com',
      password: 'password123'
    });
  userId = registerRes.body.user._id;
  userToken = registerRes.body.token;

  // Create a mock achievement for testing
  const achievement = await Achievement.create({
    id: 'FIRST_LOGIN',
    name: { ar: 'أول تسجيل دخول', en: 'First Login' },
    description: { ar: 'سجل الدخول لأول مرة', en: 'Logged in for the first time' },
    icon: 'login_icon.png',
    category: 'social',
    type: 'bronze',
    criteria: { metric: 'total_points', threshold: 1 }, // Example criteria
    rewards: { points: 50, badge: 'first_login_badge' },
    rarity: 'common'
  });
  mockAchievementId = achievement.id;

  // Create a mock challenge for testing
  const challenge = await Challenge.create({
    id: 'DAILY_EXERCISE_CHALLENGE',
    name: { ar: 'تحدي التمرين اليومي', en: 'Daily Exercise Challenge' },
    description: { ar: 'أكمل 3 تمارين يوميًا', en: 'Complete 3 exercises daily' },
    type: 'daily',
    difficulty: 'easy',
    objectives: [{
      type: 'complete_exercises',
      target: 3,
      description: { ar: 'أكمل 3 تمارين', en: 'Complete 3 exercises' }
    }],
    rewards: { points: 100, items: ['hint_token'] },
    duration: {
      start_date: new Date(),
      end_date: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
  });
  mockChallengeId = challenge.id;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Gamification Integration Tests', () => {

  describe('User Gamification Profile Endpoints', () => {
    test('should get user gamification profile', async () => {
      // Ensure profile is created (e.g., by a post-login hook or during registration)
      // For this test, we might need to manually ensure it exists if not auto-created
      await UserGamificationProfile.findOneAndUpdate(
        { user_id: userId },
        {
          $setOnInsert: {
            user_id: userId,
            level: { current: 1, experience: 0, experience_to_next: 100 },
            points: { total_earned: 0, current_balance: 0, lifetime_spent: 0 },
            statistics: {
              total_sessions: 0,
              total_exercises: 0,
              perfect_sessions: 0,
              achievements_earned: 0,
              challenges_completed: 0,
              best_streak: 0
            }
          }
        },
        { upsert: true, new: true }
      );

      const res = await request(app)
        .get(`/api/gamification/profile/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('level');
      expect(res.body).toHaveProperty('points');
      expect(res.body.user_id.toString()).toBe(userId.toString());
      expect(res.body.level.current).toBe(1);
    });

    test('should update user preferences', async () => {
      const updatedPreferences = {
        show_leaderboard: false,
        receive_challenge_notifications: false
      };

      const res = await request(app)
        .put(`/api/gamification/profile/${userId}/preferences`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedPreferences);

      expect(res.statusCode).toEqual(200);
      expect(res.body.preferences.show_leaderboard).toBe(false);
      expect(res.body.preferences.receive_challenge_notifications).toBe(false);
    });
  });

  describe('Achievement Endpoints', () => {
    test('should get user achievements', async () => {
      // Manually add an earned achievement for the user for testing
      await UserAchievement.create({
        user_id: userId,
        achievement_id: mockAchievementId,
        progress: {
          current: 1,
          target: 1,
          percentage: 100
        },
        is_completed: true,
        earned_at: new Date()
      });

      const res = await request(app)
        .get(`/api/gamification/achievements/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].achievement_id).toBe(mockAchievementId);
      expect(res.body[0].is_completed).toBe(true);
    });

    test('should claim achievement reward', async () => {
      // Ensure the achievement is completed but not claimed
      await UserAchievement.findOneAndUpdate(
        { user_id: userId, achievement_id: mockAchievementId },
        { is_completed: true, is_claimed: false, earned_at: new Date() },
        { upsert: true, new: true }
      );

      // Get current points before claiming
      const userProfileBefore = await UserGamificationProfile.findOne({ user_id: userId });
      const initialPoints = userProfileBefore ? userProfileBefore.points.current_balance : 0;

      const res = await request(app)
        .post(`/api/gamification/achievements/${mockAchievementId}/claim`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Achievement reward claimed successfully.');
      expect(res.body.userAchievement.is_claimed).toBe(true);

      // Verify points were awarded
      const userProfileAfter = await UserGamificationProfile.findOne({ user_id: userId });
      expect(userProfileAfter.points.current_balance).toBeGreaterThan(initialPoints);

      // Verify a points transaction was recorded
      const pointsTxn = await PointsTransaction.findOne({ user_id: userId, source: 'achievement', related_id: mockAchievementId });
      expect(pointsTxn).toBeDefined();
      expect(pointsTxn.amount).toBe(50); // From mock achievement
    });
  });

  describe('Challenge Endpoints', () => {
    test('should get available challenges', async () => {
      const res = await request(app)
        .get('/api/gamification/challenges')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(mockChallengeId);
    });

    test('should enroll in a challenge', async () => {
      // Ensure user is not already enrolled
      await UserChallenge.deleteOne({ user_id: userId, challenge_id: mockChallengeId });

      const res = await request(app)
        .post(`/api/gamification/challenges/${mockChallengeId}/enroll`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Enrolled in challenge successfully.');
      expect(res.body.userChallenge.user_id.toString()).toBe(userId.toString());
      expect(res.body.userChallenge.challenge_id).toBe(mockChallengeId);
      expect(res.body.userChallenge.status).toBe('active');
    });

    test('should get user challenge progress', async () => {
      // Ensure user is enrolled
      await UserChallenge.findOneAndUpdate(
        { user_id: userId, challenge_id: mockChallengeId },
        {
          $setOnInsert: {
            user_id: userId,
            challenge_id: mockChallengeId,
            status: 'active',
            progress: [{ objective_index: 0, current: 0, target: 3, completed: false }]
          }
        },
        { upsert: true, new: true }
      );

      const res = await request(app)
        .get(`/api/gamification/challenges/${userId}/progress`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].challenge_id).toBe(mockChallengeId);
      expect(res.body[0].status).toBe('active');
    });

    test('should claim challenge reward', async () => {
      // Mark challenge as completed for claiming
      await UserChallenge.findOneAndUpdate(
        { user_id: userId, challenge_id: mockChallengeId },
        { status: 'completed', completed_at: new Date(), 'progress.0.current': 3, 'progress.0.completed': true, rewards_claimed: false },
        { new: true }
      );

      const userProfileBefore = await UserGamificationProfile.findOne({ user_id: userId });
      const initialPoints = userProfileBefore ? userProfileBefore.points.current_balance : 0;

      const res = await request(app)
        .post(`/api/gamification/challenges/${mockChallengeId}/claim`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Challenge reward claimed successfully.');
      expect(res.body.userChallenge.rewards_claimed).toBe(true);

      const userProfileAfter = await UserGamificationProfile.findOne({ user_id: userId });
      expect(userProfileAfter.points.current_balance).toBeGreaterThan(initialPoints);

      const pointsTxn = await PointsTransaction.findOne({ user_id: userId, source: 'challenge_completion', related_id: mockChallengeId });
      expect(pointsTxn).toBeDefined();
      expect(pointsTxn.amount).toBe(100); // From mock challenge
    });
  });

  describe('Points and Inventory Endpoints', () => { // <--- السطر 378
    test('should get user points and inventory', async () => {
      const res = await request(app)
        .get(`/api/gamification/user-data/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('points');
      expect(res.body).toHaveProperty('inventory');
      expect(res.body.points.current_balance).toBeDefined();
      expect(res.body.inventory.hint_tokens).toBeDefined();
    });

    test('should retrieve points transactions', async () => {
      // Create a few mock transactions
      await PointsTransaction.create([
        { user_id: userId, type: 'earned', source: 'exercise_completion', amount: 10, balance_after: 100, description: { en: 'Exercise 1' } },
        { user_id: userId, type: 'earned', source: 'daily_bonus', amount: 20, balance_after: 120, description: { en: 'Daily bonus' } }
      ]);

      const res = await request(app)
        .get(`/api/gamification/points-history/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // Should include previous achievement/challenge claims + these
      expect(res.body[0]).toHaveProperty('type', 'earned');
      expect(res.body[0]).toHaveProperty('source');
    });
  });

  describe('Streak Endpoints', () => {
    test('should get user streak data', async () => {
      // Ensure streak document exists
      await Streak.findOneAndUpdate(
        { user_id: userId },
        {
          $setOnInsert: {
            user_id: userId,
            current_streak: 5,
            longest_streak: 10,
            last_activity_date: new Date()
          }
        },
        { upsert: true, new: true }
      );

      const res = await request(app)
        .get(`/api/gamification/streak/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('current_streak', 5);
      expect(res.body).toHaveProperty('longest_streak', 10);
    });
  });

  describe('Leaderboard Endpoints', () => {
    test('should get global leaderboard', async () => {
      // Create a mock leaderboard entry
      await Leaderboard.create({
        type: 'global',
        period: 'all_time',
        category: 'points',
        entries: [{ user_id: userId, rank: 1, score: 500, metadata: {} }],
        next_update: new Date(Date.now() + 1000 * 60 * 60)
      });

      const res = await request(app)
        .get('/api/gamification/leaderboard/global/all_time/points')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('entries');
      expect(res.body.entries.length).toBeGreaterThan(0);
      expect(res.body.entries[0].user_id.toString()).toBe(userId.toString());
    });

    test('should get filtered leaderboard (e.g., by curriculum)', async () => {
      // Create another specific leaderboard entry
      await Leaderboard.create({
        type: 'curriculum',
        period: 'monthly',
        category: 'exercises_completed',
        filters: { curriculum: 'Mathematics' },
        entries: [{ user_id: userId, rank: 1, score: 150, metadata: {} }],
        next_update: new Date(Date.now() + 1000 * 60 * 60 * 24)
      });

      const res = await request(app)
        .get('/api/gamification/leaderboard/curriculum/monthly/exercises_completed?curriculum=Mathematics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('entries');
      expect(res.body.entries.length).toBeGreaterThan(0);
      expect(res.body.entries[0].user_id.toString()).toBe(userId.toString());
      expect(res.body.filters.curriculum).toBe('Mathematics');
    });
  });
});