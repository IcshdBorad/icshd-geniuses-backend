const mongoose = require('mongoose');
const GamificationService = require('../../../services/GamificationService');
const {
  Achievement,
  UserAchievement,
  PointsTransaction,
  Streak,
  Challenge,
  UserChallenge,
  Leaderboard,
  UserGamificationProfile
} = require('../../../models/Gamification');
const User = require('../../../models/User');
const Session = require('../../../models/Session');
const { setupTestDB, cleanupTestDB, clearTestDB, generateTestData, testUtils } = require('../../setup');

describe('GamificationService', () => {
  let gamificationService;
  let testUser;
  let testSession;

  beforeAll(async () => {
    await setupTestDB();
    gamificationService = new GamificationService();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create test user
    const userData = generateTestData.user();
    testUser = new User(userData);
    await testUser.save();

    // Create test session
    const sessionData = generateTestData.session(testUser._id);
    testSession = new Session(sessionData);
    await testSession.save();
  });

  describe('User Profile Management', () => {
    test('should initialize user gamification profile', async () => {
      const profile = await gamificationService.initializeUserProfile(testUser._id);

      expect(profile).toBeDefined();
      expect(profile.user_id.toString()).toBe(testUser._id.toString());
      expect(profile.points.current_balance).toBe(0);
      expect(profile.level.current).toBe(1);
      expect(profile.level.experience).toBe(0);
      expect(profile.statistics.achievements_earned).toBe(0);
    });

    test('should not create duplicate profile for existing user', async () => {
      // Create initial profile
      await gamificationService.initializeUserProfile(testUser._id);
      
      // Try to initialize again
      const profile = await gamificationService.initializeUserProfile(testUser._id);
      
      // Should return existing profile
      expect(profile).toBeDefined();
      
      // Check that only one profile exists
      const profiles = await UserGamificationProfile.find({ user_id: testUser._id });
      expect(profiles).toHaveLength(1);
    });

    test('should get user gamification profile', async () => {
      // Initialize profile first
      await gamificationService.initializeUserProfile(testUser._id);
      
      const profile = await gamificationService.getUserProfile(testUser._id);
      
      expect(profile).toBeDefined();
      expect(profile.user_id.toString()).toBe(testUser._id.toString());
    });

    test('should return null for non-existent user profile', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const profile = await gamificationService.getUserProfile(nonExistentUserId);
      
      expect(profile).toBeNull();
    });
  });

  describe('Points Management', () => {
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
    });

    test('should award points to user', async () => {
      const result = await gamificationService.awardPoints(
        testUser._id,
        100,
        'exercise_completion',
        'Completed 10 exercises',
        { session_id: testSession._id }
      );

      expect(result.success).toBe(true);
      expect(result.new_balance).toBe(100);
      expect(result.transaction).toBeDefined();

      // Verify transaction was created
      const transaction = await PointsTransaction.findById(result.transaction._id);
      expect(transaction.amount).toBe(100);
      expect(transaction.type).toBe('earned');
      expect(transaction.source).toBe('exercise_completion');
    });

    test('should spend points from user balance', async () => {
      // First award some points
      await gamificationService.awardPoints(testUser._id, 200, 'exercise_completion', 'Initial points');
      
      const result = await gamificationService.spendPoints(
        testUser._id,
        50,
        'purchase',
        'Bought hint tokens',
        { item: 'hint_tokens', quantity: 5 }
      );

      expect(result.success).toBe(true);
      expect(result.new_balance).toBe(150);
      expect(result.transaction).toBeDefined();

      // Verify transaction was created
      const transaction = await PointsTransaction.findById(result.transaction._id);
      expect(transaction.amount).toBe(50);
      expect(transaction.type).toBe('spent');
      expect(transaction.source).toBe('purchase');
    });

    test('should fail to spend more points than available', async () => {
      // Award only 50 points
      await gamificationService.awardPoints(testUser._id, 50, 'exercise_completion', 'Initial points');
      
      const result = await gamificationService.spendPoints(
        testUser._id,
        100,
        'purchase',
        'Attempted purchase'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient points');
    });

    test('should get user points history', async () => {
      // Create multiple transactions
      await gamificationService.awardPoints(testUser._id, 100, 'exercise_completion', 'Session 1');
      await gamificationService.awardPoints(testUser._id, 50, 'achievement', 'First achievement');
      await gamificationService.spendPoints(testUser._id, 30, 'purchase', 'Bought items');

      const history = await gamificationService.getPointsHistory(testUser._id, { limit: 10 });

      expect(history.transactions).toHaveLength(3);
      expect(history.total_earned).toBe(150);
      expect(history.total_spent).toBe(30);
      expect(history.current_balance).toBe(120);
    });
  });

  describe('Experience and Level Management', () => {
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
    });

    test('should award experience to user', async () => {
      const result = await gamificationService.awardExperience(testUser._id, 75);

      expect(result.success).toBe(true);
      expect(result.experience_gained).toBe(75);
      expect(result.new_experience).toBe(75);
      expect(result.leveled_up).toBe(false);
      expect(result.current_level).toBe(1);
    });

    test('should handle level up when experience threshold is reached', async () => {
      const result = await gamificationService.awardExperience(testUser._id, 150); // Assuming level 1->2 needs 100 exp

      expect(result.success).toBe(true);
      expect(result.leveled_up).toBe(true);
      expect(result.current_level).toBe(2);
      expect(result.level_up_rewards).toBeDefined();
    });

    test('should award level up rewards', async () => {
      // Award enough experience to level up
      await gamificationService.awardExperience(testUser._id, 150);

      // Check that level up rewards were awarded
      const profile = await gamificationService.getUserProfile(testUser._id);
      expect(profile.level.current).toBe(2);
      
      // Check for level up reward transaction
      const transactions = await PointsTransaction.find({ 
        user_id: testUser._id, 
        source: 'level_up' 
      });
      expect(transactions.length).toBeGreaterThan(0);
    });

    test('should calculate experience requirements correctly', async () => {
      const expFor2 = gamificationService.calculateExperienceForLevel(2);
      const expFor3 = gamificationService.calculateExperienceForLevel(3);
      const expFor10 = gamificationService.calculateExperienceForLevel(10);

      expect(expFor2).toBeGreaterThan(0);
      expect(expFor3).toBeGreaterThan(expFor2);
      expect(expFor10).toBeGreaterThan(expFor3);
    });
  });

  describe('Session Processing', () => {
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
    });

    test('should process completed session and award points', async () => {
      const sessionResults = {
        exercises_completed: 10,
        correct_answers: 8,
        accuracy_rate: 80,
        total_time: 600, // 10 minutes
        perfect_exercises: 3,
        hints_used: 2,
        streak_bonus: true
      };

      const result = await gamificationService.processSessionCompletion(
        testUser._id,
        testSession._id,
        sessionResults
      );

      expect(result.success).toBe(true);
      expect(result.points_awarded).toBeGreaterThan(0);
      expect(result.experience_awarded).toBeGreaterThan(0);
      expect(result.bonuses).toBeDefined();
    });

    test('should award accuracy bonus for high accuracy', async () => {
      const sessionResults = {
        exercises_completed: 10,
        correct_answers: 10,
        accuracy_rate: 100,
        total_time: 300,
        perfect_exercises: 10,
        hints_used: 0
      };

      const result = await gamificationService.processSessionCompletion(
        testUser._id,
        testSession._id,
        sessionResults
      );

      expect(result.bonuses.accuracy_bonus).toBeDefined();
      expect(result.bonuses.perfect_session_bonus).toBeDefined();
    });

    test('should award speed bonus for fast completion', async () => {
      const sessionResults = {
        exercises_completed: 10,
        correct_answers: 8,
        accuracy_rate: 80,
        total_time: 180, // Very fast - 3 minutes
        perfect_exercises: 5,
        hints_used: 0
      };

      const result = await gamificationService.processSessionCompletion(
        testUser._id,
        testSession._id,
        sessionResults
      );

      expect(result.bonuses.speed_bonus).toBeDefined();
    });

    test('should update user streak', async () => {
      const sessionResults = {
        exercises_completed: 5,
        correct_answers: 4,
        accuracy_rate: 80,
        total_time: 300,
        perfect_exercises: 2,
        hints_used: 1
      };

      await gamificationService.processSessionCompletion(
        testUser._id,
        testSession._id,
        sessionResults
      );

      const streak = await Streak.findOne({ 
        user_id: testUser._id, 
        streak_type: 'daily_session' 
      });

      expect(streak).toBeDefined();
      expect(streak.current_count).toBe(1);
    });
  });

  describe('Achievement Management', () => {
    let achievement;
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
      
      // Create test achievement
      const achievementData = generateTestData.achievement();
      achievement = new Achievement(achievementData);
      await achievement.save();
    });

    test('should check and award achievement when criteria met', async () => {
      const userStats = {
        exercises_completed: 15, // Achievement threshold is 10
        accuracy_rate: 85,
        total_sessions: 5
      };

      const result = await gamificationService.checkAndAwardAchievements(testUser._id, userStats);

      expect(result.achievements_awarded).toHaveLength(1);
      expect(result.achievements_awarded[0].achievement_id).toBe(achievement.id);

      // Verify user achievement was created
      const userAchievement = await UserAchievement.findOne({
        user_id: testUser._id,
        achievement_id: achievement.id
      });

      expect(userAchievement).toBeDefined();
      expect(userAchievement.status).toBe('completed');
      expect(userAchievement.earned_at).toBeDefined();
    });

    test('should not award achievement if criteria not met', async () => {
      const userStats = {
        exercises_completed: 5, // Below threshold of 10
        accuracy_rate: 85,
        total_sessions: 5
      };

      const result = await gamificationService.checkAndAwardAchievements(testUser._id, userStats);

      expect(result.achievements_awarded).toHaveLength(0);
    });

    test('should not award same achievement twice', async () => {
      // Create existing user achievement
      const userAchievement = new UserAchievement({
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'completed',
        progress: 10,
        earned_at: new Date()
      });
      await userAchievement.save();

      const userStats = {
        exercises_completed: 20,
        accuracy_rate: 90,
        total_sessions: 10
      };

      const result = await gamificationService.checkAndAwardAchievements(testUser._id, userStats);

      expect(result.achievements_awarded).toHaveLength(0);
    });

    test('should claim achievement reward', async () => {
      // Create completed but unclaimed achievement
      const userAchievement = new UserAchievement({
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'completed',
        progress: 10,
        earned_at: new Date(),
        reward_claimed: false
      });
      await userAchievement.save();

      const result = await gamificationService.claimAchievementReward(testUser._id, achievement.id);

      expect(result.success).toBe(true);
      expect(result.rewards_claimed).toBeDefined();

      // Verify reward was claimed
      const updatedAchievement = await UserAchievement.findById(userAchievement._id);
      expect(updatedAchievement.reward_claimed).toBe(true);
      expect(updatedAchievement.reward_claimed_at).toBeDefined();
    });

    test('should fail to claim already claimed reward', async () => {
      // Create already claimed achievement
      const userAchievement = new UserAchievement({
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'completed',
        progress: 10,
        earned_at: new Date(),
        reward_claimed: true,
        reward_claimed_at: new Date()
      });
      await userAchievement.save();

      const result = await gamificationService.claimAchievementReward(testUser._id, achievement.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already claimed');
    });
  });

  describe('Challenge Management', () => {
    let challenge;
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
      
      // Create test challenge
      const challengeData = generateTestData.challenge();
      challenge = new Challenge(challengeData);
      await challenge.save();
    });

    test('should join challenge', async () => {
      const result = await gamificationService.joinChallenge(testUser._id, challenge.id);

      expect(result.success).toBe(true);
      expect(result.user_challenge).toBeDefined();

      // Verify user challenge was created
      const userChallenge = await UserChallenge.findOne({
        user_id: testUser._id,
        challenge_id: challenge.id
      });

      expect(userChallenge).toBeDefined();
      expect(userChallenge.status).toBe('joined');
      expect(userChallenge.joined_at).toBeDefined();
    });

    test('should not join same challenge twice', async () => {
      // Join challenge first time
      await gamificationService.joinChallenge(testUser._id, challenge.id);
      
      // Try to join again
      const result = await gamificationService.joinChallenge(testUser._id, challenge.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already joined');
    });

    test('should update challenge progress', async () => {
      // Join challenge first
      await gamificationService.joinChallenge(testUser._id, challenge.id);

      const progressData = {
        objective_id: 'obj1',
        value: 3
      };

      const result = await gamificationService.updateChallengeProgress(
        testUser._id,
        challenge.id,
        progressData
      );

      expect(result.success).toBe(true);
      expect(result.progress_updated).toBe(true);

      // Verify progress was updated
      const userChallenge = await UserChallenge.findOne({
        user_id: testUser._id,
        challenge_id: challenge.id
      });

      const objective = userChallenge.progress.find(p => p.objective_id === 'obj1');
      expect(objective.current_value).toBe(3);
    });

    test('should complete challenge when all objectives met', async () => {
      // Join challenge first
      await gamificationService.joinChallenge(testUser._id, challenge.id);

      const progressData = {
        objective_id: 'obj1',
        value: 5 // Target value is 5
      };

      const result = await gamificationService.updateChallengeProgress(
        testUser._id,
        challenge.id,
        progressData
      );

      expect(result.success).toBe(true);
      expect(result.challenge_completed).toBe(true);
      expect(result.rewards_awarded).toBeDefined();

      // Verify challenge was completed
      const userChallenge = await UserChallenge.findOne({
        user_id: testUser._id,
        challenge_id: challenge.id
      });

      expect(userChallenge.status).toBe('completed');
      expect(userChallenge.completed_at).toBeDefined();
    });
  });

  describe('Leaderboard Management', () => {
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
    });

    test('should update user leaderboard entry', async () => {
      const leaderboardData = {
        type: 'global',
        period: 'weekly',
        category: 'points'
      };

      const userData = {
        user_id: testUser._id,
        score: 1500,
        metadata: {
          level: 3,
          streak: 7
        }
      };

      const result = await gamificationService.updateLeaderboardEntry(leaderboardData, userData);

      expect(result.success).toBe(true);
      expect(result.leaderboard).toBeDefined();

      // Verify leaderboard was created/updated
      const leaderboard = await Leaderboard.findOne(leaderboardData);
      expect(leaderboard).toBeDefined();
      expect(leaderboard.entries).toHaveLength(1);
      expect(leaderboard.entries[0].user_id.toString()).toBe(testUser._id.toString());
      expect(leaderboard.entries[0].score).toBe(1500);
    });

    test('should update existing leaderboard entry', async () => {
      // Create initial leaderboard entry
      const leaderboard = new Leaderboard({
        type: 'global',
        period: 'weekly',
        category: 'points',
        entries: [
          {
            user_id: testUser._id,
            score: 1000,
            rank: 1,
            metadata: { level: 2, streak: 5 }
          }
        ],
        last_updated: new Date()
      });
      await leaderboard.save();

      const leaderboardData = {
        type: 'global',
        period: 'weekly',
        category: 'points'
      };

      const userData = {
        user_id: testUser._id,
        score: 1800,
        metadata: {
          level: 4,
          streak: 10
        }
      };

      const result = await gamificationService.updateLeaderboardEntry(leaderboardData, userData);

      expect(result.success).toBe(true);

      // Verify entry was updated
      const updatedLeaderboard = await Leaderboard.findOne(leaderboardData);
      expect(updatedLeaderboard.entries).toHaveLength(1);
      expect(updatedLeaderboard.entries[0].score).toBe(1800);
      expect(updatedLeaderboard.entries[0].metadata.level).toBe(4);
    });

    test('should get user leaderboard rank', async () => {
      // Create leaderboard with multiple entries
      const leaderboard = new Leaderboard({
        type: 'global',
        period: 'weekly',
        category: 'points',
        entries: [
          { user_id: new mongoose.Types.ObjectId(), score: 2000, rank: 1 },
          { user_id: testUser._id, score: 1500, rank: 2 },
          { user_id: new mongoose.Types.ObjectId(), score: 1000, rank: 3 }
        ],
        last_updated: new Date()
      });
      await leaderboard.save();

      const rank = await gamificationService.getUserLeaderboardRank(
        testUser._id,
        'global',
        'weekly',
        'points'
      );

      expect(rank.rank).toBe(2);
      expect(rank.score).toBe(1500);
      expect(rank.total_participants).toBe(3);
    });
  });

  describe('Streak Management', () => {
    let userProfile;

    beforeEach(async () => {
      userProfile = await gamificationService.initializeUserProfile(testUser._id);
    });

    test('should initialize user streak', async () => {
      const streak = await gamificationService.initializeUserStreak(testUser._id, 'daily_session');

      expect(streak).toBeDefined();
      expect(streak.user_id.toString()).toBe(testUser._id.toString());
      expect(streak.streak_type).toBe('daily_session');
      expect(streak.current_count).toBe(0);
      expect(streak.longest_count).toBe(0);
    });

    test('should update streak for consecutive days', async () => {
      // Initialize streak
      await gamificationService.initializeUserStreak(testUser._id, 'daily_session');

      // Update streak for today
      const result = await gamificationService.updateUserStreak(testUser._id, 'daily_session');

      expect(result.success).toBe(true);
      expect(result.current_streak).toBe(1);
      expect(result.longest_streak).toBe(1);
    });

    test('should maintain streak for same day', async () => {
      // Initialize and update streak
      await gamificationService.initializeUserStreak(testUser._id, 'daily_session');
      await gamificationService.updateUserStreak(testUser._id, 'daily_session');

      // Update again on same day
      const result = await gamificationService.updateUserStreak(testUser._id, 'daily_session');

      expect(result.success).toBe(true);
      expect(result.current_streak).toBe(1); // Should remain 1
    });

    test('should reset streak after gap', async () => {
      // Create streak with last activity 3 days ago
      const streak = new Streak({
        user_id: testUser._id,
        streak_type: 'daily_session',
        current_count: 5,
        longest_count: 8,
        last_activity_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      });
      await streak.save();

      const result = await gamificationService.updateUserStreak(testUser._id, 'daily_session');

      expect(result.success).toBe(true);
      expect(result.current_streak).toBe(1); // Reset to 1
      expect(result.longest_streak).toBe(8); // Should remain unchanged
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid user ID', async () => {
      const invalidUserId = 'invalid-id';
      
      const result = await gamificationService.awardPoints(
        invalidUserId,
        100,
        'exercise_completion',
        'Test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle non-existent achievement', async () => {
      const result = await gamificationService.claimAchievementReward(
        testUser._id,
        'non-existent-achievement'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should handle non-existent challenge', async () => {
      const result = await gamificationService.joinChallenge(
        testUser._id,
        'non-existent-challenge'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Performance Tests', () => {
    test('should process large session efficiently', async () => {
      await gamificationService.initializeUserProfile(testUser._id);

      const sessionResults = {
        exercises_completed: 100,
        correct_answers: 85,
        accuracy_rate: 85,
        total_time: 3600, // 1 hour
        perfect_exercises: 30,
        hints_used: 10
      };

      const startTime = Date.now();
      const result = await gamificationService.processSessionCompletion(
        testUser._id,
        testSession._id,
        sessionResults
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    test('should handle multiple concurrent operations', async () => {
      await gamificationService.initializeUserProfile(testUser._id);

      const operations = [
        gamificationService.awardPoints(testUser._id, 50, 'exercise_completion', 'Test 1'),
        gamificationService.awardExperience(testUser._id, 25),
        gamificationService.updateUserStreak(testUser._id, 'daily_session')
      ];

      const results = await Promise.all(operations);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});
