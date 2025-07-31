const mongoose = require('mongoose');
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
const { setupTestDB, cleanupTestDB, clearTestDB, generateTestData, testUtils } = require('../../setup');

describe('Gamification Models', () => {
  let testUser;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    
    // Create a test user
    const userData = generateTestData.user();
    testUser = new User(userData);
    await testUser.save();
  });

  describe('Achievement Model', () => {
    test('should create a valid achievement', async () => {
      const achievementData = generateTestData.achievement();
      const achievement = new Achievement(achievementData);
      const savedAchievement = await achievement.save();

      expect(savedAchievement._id).toBeDefined();
      expect(savedAchievement.id).toBe(achievementData.id);
      expect(savedAchievement.name.ar).toBe(achievementData.name.ar);
      expect(savedAchievement.name.en).toBe(achievementData.name.en);
      expect(savedAchievement.category).toBe(achievementData.category);
      expect(savedAchievement.type).toBe(achievementData.type);
      expect(savedAchievement.created_at).toBeDefined();
    });

    test('should require unique achievement id', async () => {
      const achievementData = generateTestData.achievement();
      
      const achievement1 = new Achievement(achievementData);
      await achievement1.save();

      const achievement2 = new Achievement(achievementData);
      await expect(achievement2.save()).rejects.toThrow();
    });

    test('should validate category enum', async () => {
      const achievementData = generateTestData.achievement({ category: 'invalid_category' });
      const achievement = new Achievement(achievementData);

      await expect(achievement.save()).rejects.toThrow();
    });

    test('should validate type enum', async () => {
      const achievementData = generateTestData.achievement({ type: 'invalid_type' });
      const achievement = new Achievement(achievementData);

      await expect(achievement.save()).rejects.toThrow();
    });

    test('should check if user meets criteria', async () => {
      const achievementData = generateTestData.achievement({
        criteria: {
          metric: 'exercises_completed',
          threshold: 50,
          timeframe: null
        }
      });
      
      const achievement = new Achievement(achievementData);
      await achievement.save();

      const userStats = {
        exercises_completed: 60,
        accuracy_rate: 85,
        total_sessions: 20
      };

      const meetsCriteria = achievement.checkCriteria(userStats);
      expect(meetsCriteria).toBe(true);
    });

    test('should fail criteria check when threshold not met', async () => {
      const achievementData = generateTestData.achievement({
        criteria: {
          metric: 'exercises_completed',
          threshold: 100,
          timeframe: null
        }
      });
      
      const achievement = new Achievement(achievementData);
      await achievement.save();

      const userStats = {
        exercises_completed: 50,
        accuracy_rate: 85,
        total_sessions: 20
      };

      const meetsCriteria = achievement.checkCriteria(userStats);
      expect(meetsCriteria).toBe(false);
    });
  });

  describe('UserAchievement Model', () => {
    let achievement;

    beforeEach(async () => {
      const achievementData = generateTestData.achievement();
      achievement = new Achievement(achievementData);
      await achievement.save();
    });

    test('should create a valid user achievement', async () => {
      const userAchievementData = {
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'in_progress',
        progress: 5,
        earned_at: null,
        reward_claimed: false
      };

      const userAchievement = new UserAchievement(userAchievementData);
      const savedUserAchievement = await userAchievement.save();

      expect(savedUserAchievement._id).toBeDefined();
      expect(savedUserAchievement.user_id.toString()).toBe(testUser._id.toString());
      expect(savedUserAchievement.achievement_id).toBe(achievement.id);
      expect(savedUserAchievement.status).toBe('in_progress');
      expect(savedUserAchievement.progress).toBe(5);
    });

    test('should require unique user-achievement combination', async () => {
      const userAchievementData = {
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'in_progress',
        progress: 5
      };

      const userAchievement1 = new UserAchievement(userAchievementData);
      await userAchievement1.save();

      const userAchievement2 = new UserAchievement(userAchievementData);
      await expect(userAchievement2.save()).rejects.toThrow();
    });

    test('should update progress', async () => {
      const userAchievementData = {
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'in_progress',
        progress: 5
      };

      const userAchievement = new UserAchievement(userAchievementData);
      await userAchievement.save();

      await userAchievement.updateProgress(8);

      expect(userAchievement.progress).toBe(8);
      expect(userAchievement.updated_at).toBeDefined();
    });

    test('should complete achievement when threshold reached', async () => {
      const userAchievementData = {
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'in_progress',
        progress: 9
      };

      const userAchievement = new UserAchievement(userAchievementData);
      await userAchievement.save();

      await userAchievement.updateProgress(10); // Threshold is 10

      expect(userAchievement.status).toBe('completed');
      expect(userAchievement.earned_at).toBeDefined();
    });
  });

  describe('PointsTransaction Model', () => {
    test('should create a valid points transaction', async () => {
      const transactionData = {
        user_id: testUser._id,
        type: 'earned',
        amount: 100,
        source: 'exercise_completion',
        description: 'Completed 10 exercises',
        balance_after: 100,
        metadata: {
          session_id: new mongoose.Types.ObjectId(),
          exercises_completed: 10
        }
      };

      const transaction = new PointsTransaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction._id).toBeDefined();
      expect(savedTransaction.user_id.toString()).toBe(testUser._id.toString());
      expect(savedTransaction.type).toBe('earned');
      expect(savedTransaction.amount).toBe(100);
      expect(savedTransaction.source).toBe('exercise_completion');
      expect(savedTransaction.balance_after).toBe(100);
    });

    test('should validate transaction type', async () => {
      const transactionData = {
        user_id: testUser._id,
        type: 'invalid_type',
        amount: 100,
        source: 'exercise_completion',
        balance_after: 100
      };

      const transaction = new PointsTransaction(transactionData);
      await expect(transaction.save()).rejects.toThrow();
    });

    test('should validate source enum', async () => {
      const transactionData = {
        user_id: testUser._id,
        type: 'earned',
        amount: 100,
        source: 'invalid_source',
        balance_after: 100
      };

      const transaction = new PointsTransaction(transactionData);
      await expect(transaction.save()).rejects.toThrow();
    });

    test('should require positive amount for earned transactions', async () => {
      const transactionData = {
        user_id: testUser._id,
        type: 'earned',
        amount: -50,
        source: 'exercise_completion',
        balance_after: 50
      };

      const transaction = new PointsTransaction(transactionData);
      await expect(transaction.save()).rejects.toThrow();
    });
  });

  describe('Streak Model', () => {
    test('should create a valid streak', async () => {
      const streakData = {
        user_id: testUser._id,
        current_count: 5,
        longest_count: 10,
        last_activity_date: new Date(),
        streak_type: 'daily_login'
      };

      const streak = new Streak(streakData);
      const savedStreak = await streak.save();

      expect(savedStreak._id).toBeDefined();
      expect(savedStreak.user_id.toString()).toBe(testUser._id.toString());
      expect(savedStreak.current_count).toBe(5);
      expect(savedStreak.longest_count).toBe(10);
      expect(savedStreak.streak_type).toBe('daily_login');
    });

    test('should update streak count', async () => {
      const streakData = {
        user_id: testUser._id,
        current_count: 5,
        longest_count: 10,
        last_activity_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        streak_type: 'daily_login'
      };

      const streak = new Streak(streakData);
      await streak.save();

      await streak.updateStreak();

      expect(streak.current_count).toBe(6);
      expect(streak.last_activity_date).toBeDefined();
    });

    test('should update longest streak when current exceeds it', async () => {
      const streakData = {
        user_id: testUser._id,
        current_count: 10,
        longest_count: 10,
        last_activity_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        streak_type: 'daily_login'
      };

      const streak = new Streak(streakData);
      await streak.save();

      await streak.updateStreak();

      expect(streak.current_count).toBe(11);
      expect(streak.longest_count).toBe(11);
    });

    test('should reset streak if gap is too long', async () => {
      const streakData = {
        user_id: testUser._id,
        current_count: 5,
        longest_count: 10,
        last_activity_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        streak_type: 'daily_login'
      };

      const streak = new Streak(streakData);
      await streak.save();

      await streak.updateStreak();

      expect(streak.current_count).toBe(1);
      expect(streak.longest_count).toBe(10); // Should remain unchanged
    });
  });

  describe('Challenge Model', () => {
    test('should create a valid challenge', async () => {
      const challengeData = generateTestData.challenge();
      const challenge = new Challenge(challengeData);
      const savedChallenge = await challenge.save();

      expect(savedChallenge._id).toBeDefined();
      expect(savedChallenge.id).toBe(challengeData.id);
      expect(savedChallenge.name.ar).toBe(challengeData.name.ar);
      expect(savedChallenge.name.en).toBe(challengeData.name.en);
      expect(savedChallenge.type).toBe(challengeData.type);
      expect(savedChallenge.difficulty).toBe(challengeData.difficulty);
    });

    test('should validate challenge type', async () => {
      const challengeData = generateTestData.challenge({ type: 'invalid_type' });
      const challenge = new Challenge(challengeData);

      await expect(challenge.save()).rejects.toThrow();
    });

    test('should validate difficulty enum', async () => {
      const challengeData = generateTestData.challenge({ difficulty: 'invalid_difficulty' });
      const challenge = new Challenge(challengeData);

      await expect(challenge.save()).rejects.toThrow();
    });

    test('should check if challenge is active', async () => {
      const now = new Date();
      const challengeData = generateTestData.challenge({
        duration: {
          start_date: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
          end_date: new Date(now.getTime() + 60 * 60 * 1000)    // 1 hour from now
        }
      });

      const challenge = new Challenge(challengeData);
      await challenge.save();

      const isActive = challenge.isActive();
      expect(isActive).toBe(true);
    });

    test('should check if challenge is expired', async () => {
      const now = new Date();
      const challengeData = generateTestData.challenge({
        duration: {
          start_date: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          end_date: new Date(now.getTime() - 60 * 60 * 1000)        // 1 hour ago
        }
      });

      const challenge = new Challenge(challengeData);
      await challenge.save();

      const isActive = challenge.isActive();
      expect(isActive).toBe(false);
    });
  });

  describe('UserChallenge Model', () => {
    let challenge;

    beforeEach(async () => {
      const challengeData = generateTestData.challenge();
      challenge = new Challenge(challengeData);
      await challenge.save();
    });

    test('should create a valid user challenge', async () => {
      const userChallengeData = {
        user_id: testUser._id,
        challenge_id: challenge.id,
        status: 'joined',
        progress: [
          {
            objective_id: 'obj1',
            current_value: 3,
            target_value: 5,
            completed: false
          }
        ],
        joined_at: new Date()
      };

      const userChallenge = new UserChallenge(userChallengeData);
      const savedUserChallenge = await userChallenge.save();

      expect(savedUserChallenge._id).toBeDefined();
      expect(savedUserChallenge.user_id.toString()).toBe(testUser._id.toString());
      expect(savedUserChallenge.challenge_id).toBe(challenge.id);
      expect(savedUserChallenge.status).toBe('joined');
      expect(savedUserChallenge.progress).toHaveLength(1);
    });

    test('should update objective progress', async () => {
      const userChallengeData = {
        user_id: testUser._id,
        challenge_id: challenge.id,
        status: 'joined',
        progress: [
          {
            objective_id: 'obj1',
            current_value: 3,
            target_value: 5,
            completed: false
          }
        ],
        joined_at: new Date()
      };

      const userChallenge = new UserChallenge(userChallengeData);
      await userChallenge.save();

      await userChallenge.updateObjectiveProgress('obj1', 5);

      const objective = userChallenge.progress.find(p => p.objective_id === 'obj1');
      expect(objective.current_value).toBe(5);
      expect(objective.completed).toBe(true);
    });

    test('should complete challenge when all objectives are done', async () => {
      const userChallengeData = {
        user_id: testUser._id,
        challenge_id: challenge.id,
        status: 'joined',
        progress: [
          {
            objective_id: 'obj1',
            current_value: 4,
            target_value: 5,
            completed: false
          }
        ],
        joined_at: new Date()
      };

      const userChallenge = new UserChallenge(userChallengeData);
      await userChallenge.save();

      await userChallenge.updateObjectiveProgress('obj1', 5);

      expect(userChallenge.status).toBe('completed');
      expect(userChallenge.completed_at).toBeDefined();
    });

    test('should calculate completion percentage', async () => {
      const userChallengeData = {
        user_id: testUser._id,
        challenge_id: challenge.id,
        status: 'joined',
        progress: [
          {
            objective_id: 'obj1',
            current_value: 3,
            target_value: 5,
            completed: false
          }
        ],
        joined_at: new Date()
      };

      const userChallenge = new UserChallenge(userChallengeData);
      await userChallenge.save();

      const percentage = userChallenge.getCompletionPercentage();
      expect(percentage).toBe(60); // 3/5 * 100
    });
  });

  describe('Leaderboard Model', () => {
    test('should create a valid leaderboard', async () => {
      const leaderboardData = {
        type: 'global',
        period: 'weekly',
        category: 'points',
        entries: [
          {
            user_id: testUser._id,
            score: 1500,
            rank: 1,
            metadata: {
              level: 5,
              streak: 10
            }
          }
        ],
        last_updated: new Date()
      };

      const leaderboard = new Leaderboard(leaderboardData);
      const savedLeaderboard = await leaderboard.save();

      expect(savedLeaderboard._id).toBeDefined();
      expect(savedLeaderboard.type).toBe('global');
      expect(savedLeaderboard.period).toBe('weekly');
      expect(savedLeaderboard.category).toBe('points');
      expect(savedLeaderboard.entries).toHaveLength(1);
    });

    test('should validate leaderboard type', async () => {
      const leaderboardData = {
        type: 'invalid_type',
        period: 'weekly',
        category: 'points',
        entries: []
      };

      const leaderboard = new Leaderboard(leaderboardData);
      await expect(leaderboard.save()).rejects.toThrow();
    });

    test('should add entry to leaderboard', async () => {
      const leaderboardData = {
        type: 'global',
        period: 'weekly',
        category: 'points',
        entries: [],
        last_updated: new Date()
      };

      const leaderboard = new Leaderboard(leaderboardData);
      await leaderboard.save();

      const entryData = {
        user_id: testUser._id,
        score: 1200,
        metadata: {
          level: 3,
          streak: 5
        }
      };

      await leaderboard.addEntry(entryData);

      expect(leaderboard.entries).toHaveLength(1);
      expect(leaderboard.entries[0].user_id.toString()).toBe(testUser._id.toString());
      expect(leaderboard.entries[0].score).toBe(1200);
      expect(leaderboard.entries[0].rank).toBe(1);
    });

    test('should sort entries by score', async () => {
      const leaderboardData = {
        type: 'global',
        period: 'weekly',
        category: 'points',
        entries: [],
        last_updated: new Date()
      };

      const leaderboard = new Leaderboard(leaderboardData);
      await leaderboard.save();

      // Add multiple entries
      const entries = [
        { user_id: new mongoose.Types.ObjectId(), score: 1000 },
        { user_id: new mongoose.Types.ObjectId(), score: 1500 },
        { user_id: new mongoose.Types.ObjectId(), score: 800 }
      ];

      for (const entry of entries) {
        await leaderboard.addEntry(entry);
      }

      await leaderboard.sortAndRank();

      expect(leaderboard.entries[0].score).toBe(1500);
      expect(leaderboard.entries[0].rank).toBe(1);
      expect(leaderboard.entries[1].score).toBe(1000);
      expect(leaderboard.entries[1].rank).toBe(2);
      expect(leaderboard.entries[2].score).toBe(800);
      expect(leaderboard.entries[2].rank).toBe(3);
    });
  });

  describe('UserGamificationProfile Model', () => {
    test('should create a valid user gamification profile', async () => {
      const profileData = {
        user_id: testUser._id,
        points: {
          current_balance: 500,
          total_earned: 1000,
          total_spent: 500
        },
        level: {
          current: 3,
          experience: 250,
          experience_to_next: 500
        },
        statistics: {
          achievements_earned: 5,
          challenges_completed: 3,
          longest_streak: 15,
          total_sessions: 50
        }
      };

      const profile = new UserGamificationProfile(profileData);
      const savedProfile = await profile.save();

      expect(savedProfile._id).toBeDefined();
      expect(savedProfile.user_id.toString()).toBe(testUser._id.toString());
      expect(savedProfile.points.current_balance).toBe(500);
      expect(savedProfile.level.current).toBe(3);
      expect(savedProfile.statistics.achievements_earned).toBe(5);
    });

    test('should require unique user_id', async () => {
      const profileData = {
        user_id: testUser._id,
        points: { current_balance: 100, total_earned: 100, total_spent: 0 },
        level: { current: 1, experience: 0, experience_to_next: 100 }
      };

      const profile1 = new UserGamificationProfile(profileData);
      await profile1.save();

      const profile2 = new UserGamificationProfile(profileData);
      await expect(profile2.save()).rejects.toThrow();
    });

    test('should add points to balance', async () => {
      const profileData = {
        user_id: testUser._id,
        points: {
          current_balance: 100,
          total_earned: 100,
          total_spent: 0
        }
      };

      const profile = new UserGamificationProfile(profileData);
      await profile.save();

      await profile.addPoints(50);

      expect(profile.points.current_balance).toBe(150);
      expect(profile.points.total_earned).toBe(150);
    });

    test('should spend points from balance', async () => {
      const profileData = {
        user_id: testUser._id,
        points: {
          current_balance: 100,
          total_earned: 100,
          total_spent: 0
        }
      };

      const profile = new UserGamificationProfile(profileData);
      await profile.save();

      const success = await profile.spendPoints(30);

      expect(success).toBe(true);
      expect(profile.points.current_balance).toBe(70);
      expect(profile.points.total_spent).toBe(30);
    });

    test('should fail to spend more points than available', async () => {
      const profileData = {
        user_id: testUser._id,
        points: {
          current_balance: 50,
          total_earned: 50,
          total_spent: 0
        }
      };

      const profile = new UserGamificationProfile(profileData);
      await profile.save();

      const success = await profile.spendPoints(100);

      expect(success).toBe(false);
      expect(profile.points.current_balance).toBe(50); // Should remain unchanged
    });

    test('should add experience and handle level up', async () => {
      const profileData = {
        user_id: testUser._id,
        level: {
          current: 2,
          experience: 80,
          experience_to_next: 100
        }
      };

      const profile = new UserGamificationProfile(profileData);
      await profile.save();

      const leveledUp = await profile.addExperience(30);

      expect(leveledUp).toBe(true);
      expect(profile.level.current).toBe(3);
      expect(profile.level.experience).toBe(10); // 80 + 30 - 100
    });

    test('should not level up if experience is insufficient', async () => {
      const profileData = {
        user_id: testUser._id,
        level: {
          current: 2,
          experience: 80,
          experience_to_next: 100
        }
      };

      const profile = new UserGamificationProfile(profileData);
      await profile.save();

      const leveledUp = await profile.addExperience(10);

      expect(leveledUp).toBe(false);
      expect(profile.level.current).toBe(2);
      expect(profile.level.experience).toBe(90);
    });
  });

  describe('Gamification Integration', () => {
    test('should handle complete achievement workflow', async () => {
      // Create achievement
      const achievementData = generateTestData.achievement();
      const achievement = new Achievement(achievementData);
      await achievement.save();

      // Create user achievement
      const userAchievement = new UserAchievement({
        user_id: testUser._id,
        achievement_id: achievement.id,
        status: 'in_progress',
        progress: 8
      });
      await userAchievement.save();

      // Create user profile
      const profile = new UserGamificationProfile({
        user_id: testUser._id,
        points: { current_balance: 0, total_earned: 0, total_spent: 0 }
      });
      await profile.save();

      // Update progress to complete achievement
      await userAchievement.updateProgress(10);

      // Award points
      await profile.addPoints(achievement.rewards.points);

      // Verify achievement completion
      expect(userAchievement.status).toBe('completed');
      expect(userAchievement.earned_at).toBeDefined();

      // Verify points awarded
      expect(profile.points.current_balance).toBe(achievement.rewards.points);
      expect(profile.points.total_earned).toBe(achievement.rewards.points);
    });

    test('should handle challenge completion workflow', async () => {
      // Create challenge
      const challengeData = generateTestData.challenge();
      const challenge = new Challenge(challengeData);
      await challenge.save();

      // Join challenge
      const userChallenge = new UserChallenge({
        user_id: testUser._id,
        challenge_id: challenge.id,
        status: 'joined',
        progress: [
          {
            objective_id: 'obj1',
            current_value: 0,
            target_value: 5,
            completed: false
          }
        ],
        joined_at: new Date()
      });
      await userChallenge.save();

      // Create user profile
      const profile = new UserGamificationProfile({
        user_id: testUser._id,
        points: { current_balance: 100, total_earned: 100, total_spent: 0 }
      });
      await profile.save();

      // Complete challenge objective
      await userChallenge.updateObjectiveProgress('obj1', 5);

      // Award challenge rewards
      await profile.addPoints(challenge.rewards.points);

      // Verify challenge completion
      expect(userChallenge.status).toBe('completed');
      expect(userChallenge.completed_at).toBeDefined();

      // Verify points awarded
      expect(profile.points.current_balance).toBe(100 + challenge.rewards.points);
    });
  });
});
