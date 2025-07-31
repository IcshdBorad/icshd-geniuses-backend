const {
  Achievement,
  UserAchievement,
  PointsTransaction,
  Streak,
  Challenge,
  UserChallenge,
  Leaderboard,
  UserGamificationProfile
} = require('../models/Gamification');
const User = require('../models/User');
const Session = require('../models/Session');

class GamificationService {
  constructor() {
    this.pointsConfig = {
      exercise_completion: 10,
      perfect_accuracy: 20,
      speed_bonus: 15,
      streak_bonus: 5,
      level_up: 100,
      achievement: 50,
      daily_login: 5,
      challenge_completion: 200
    };

    this.experienceConfig = {
      exercise_completion: 15,
      perfect_session: 50,
      level_advancement: 200,
      achievement_earned: 75
    };
  }

  // Initialize user gamification profile
  async initializeUserProfile(userId) {
    try {
      let profile = await UserGamificationProfile.findOne({ user_id: userId });
      
      if (!profile) {
        profile = new UserGamificationProfile({
          user_id: userId,
          level: {
            current: 1,
            experience: 0,
            experience_to_next: 100
          },
          points: {
            total_earned: 0,
            current_balance: 0,
            lifetime_spent: 0
          },
          inventory: {
            hint_tokens: 3,
            skip_tokens: 1,
            freeze_tokens: 0,
            bonus_multipliers: 0
          }
        });
        
        await profile.save();
        
        // Initialize streak tracking
        await this.initializeStreak(userId);
        
        // Award welcome achievement
        await this.checkAndAwardAchievement(userId, 'welcome_aboard');
      }
      
      return profile;
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw error;
    }
  }

  // Award points to user
  async awardPoints(userId, source, amount, description = null, relatedId = null, sessionId = null) {
    try {
      const profile = await this.getUserProfile(userId);
      const newBalance = profile.points.current_balance + amount;
      
      // Create transaction record
      const transaction = new PointsTransaction({
        user_id: userId,
        type: 'earned',
        source: source,
        amount: amount,
        balance_after: newBalance,
        description: description,
        related_id: relatedId,
        session_id: sessionId
      });
      
      await transaction.save();
      
      // Update user profile
      profile.points.total_earned += amount;
      profile.points.current_balance = newBalance;
      await profile.save();
      
      // Check for points-based achievements
      await this.checkPointsAchievements(userId, profile.points.total_earned);
      
      return {
        transaction,
        new_balance: newBalance,
        total_earned: profile.points.total_earned
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  // Spend points
  async spendPoints(userId, amount, description, relatedId = null) {
    try {
      const profile = await this.getUserProfile(userId);
      
      if (profile.points.current_balance < amount) {
        throw new Error('Insufficient points balance');
      }
      
      const newBalance = profile.points.current_balance - amount;
      
      // Create transaction record
      const transaction = new PointsTransaction({
        user_id: userId,
        type: 'spent',
        source: 'purchase',
        amount: -amount,
        balance_after: newBalance,
        description: description,
        related_id: relatedId
      });
      
      await transaction.save();
      
      // Update user profile
      profile.points.current_balance = newBalance;
      profile.points.lifetime_spent += amount;
      await profile.save();
      
      return {
        transaction,
        new_balance: newBalance
      };
    } catch (error) {
      console.error('Error spending points:', error);
      throw error;
    }
  }

  // Award experience and handle level ups
  async awardExperience(userId, source, amount) {
    try {
      const profile = await this.getUserProfile(userId);
      const oldLevel = profile.level.current;
      
      profile.addExperience(amount);
      await profile.save();
      
      const newLevel = profile.level.current;
      
      // Check for level up
      if (newLevel > oldLevel) {
        await this.handleLevelUp(userId, oldLevel, newLevel);
      }
      
      return {
        old_level: oldLevel,
        new_level: newLevel,
        experience_gained: amount,
        current_experience: profile.level.experience,
        experience_to_next: profile.level.experience_to_next
      };
    } catch (error) {
      console.error('Error awarding experience:', error);
      throw error;
    }
  }

  // Handle level up rewards and achievements
  async handleLevelUp(userId, oldLevel, newLevel) {
    try {
      // Award level up points
      const pointsAwarded = this.pointsConfig.level_up * (newLevel - oldLevel);
      await this.awardPoints(userId, 'level_up', pointsAwarded, {
        ar: `ترقية إلى المستوى ${newLevel}`,
        en: `Level up to ${newLevel}`
      });
      
      // Check for level-based achievements
      await this.checkLevelAchievements(userId, newLevel);
      
      // Award special rewards for milestone levels
      if (newLevel % 5 === 0) {
        const profile = await this.getUserProfile(userId);
        profile.inventory.hint_tokens += 2;
        profile.inventory.skip_tokens += 1;
        
        if (newLevel % 10 === 0) {
          profile.inventory.freeze_tokens += 1;
        }
        
        await profile.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error handling level up:', error);
      throw error;
    }
  }

  // Process session completion for gamification
  async processSessionCompletion(sessionId) {
    try {
      const session = await Session.findById(sessionId).populate('user_id');
      if (!session) {
        throw new Error('Session not found');
      }
      
      const userId = session.user_id._id;
      const results = session.results;
      
      // Award base points for completion
      let totalPoints = this.pointsConfig.exercise_completion * results.total_exercises;
      let totalExperience = this.experienceConfig.exercise_completion * results.total_exercises;
      
      // Bonus for high accuracy
      if (results.accuracy >= 90) {
        const accuracyBonus = Math.floor(totalPoints * 0.5);
        totalPoints += accuracyBonus;
        totalExperience += this.experienceConfig.perfect_session;
        
        if (results.accuracy === 100) {
          await this.awardPoints(userId, 'perfect_accuracy', this.pointsConfig.perfect_accuracy, {
            ar: 'دقة مثالية 100%',
            en: 'Perfect 100% accuracy'
          }, sessionId);
        }
      }
      
      // Speed bonus
      if (results.average_time <= 5) { // 5 seconds or less average
        const speedBonus = this.pointsConfig.speed_bonus;
        totalPoints += speedBonus;
        await this.awardPoints(userId, 'speed_bonus', speedBonus, {
          ar: 'مكافأة السرعة',
          en: 'Speed bonus'
        }, sessionId);
      }
      
      // Award points and experience
      await this.awardPoints(userId, 'exercise_completion', totalPoints, {
        ar: `إكمال ${results.total_exercises} تمارين`,
        en: `Completed ${results.total_exercises} exercises`
      }, sessionId);
      
      await this.awardExperience(userId, 'exercise_completion', totalExperience);
      
      // Update streak
      await this.updateStreak(userId, 'daily_exercise');
      
      // Update statistics
      await this.updateUserStatistics(userId, session);
      
      // Check achievements
      await this.checkSessionAchievements(userId, session);
      
      // Update challenges progress
      await this.updateChallengeProgress(userId, session);
      
      return {
        points_awarded: totalPoints,
        experience_awarded: totalExperience
      };
    } catch (error) {
      console.error('Error processing session completion:', error);
      throw error;
    }
  }

  // Update user statistics
  async updateUserStatistics(userId, session) {
    try {
      const profile = await this.getUserProfile(userId);
      
      profile.statistics.total_sessions += 1;
      profile.statistics.total_exercises += session.results.total_exercises;
      
      if (session.results.accuracy === 100) {
        profile.statistics.perfect_sessions += 1;
      }
      
      await profile.save();
      
      return profile.statistics;
    } catch (error) {
      console.error('Error updating user statistics:', error);
      throw error;
    }
  }

  // Streak management
  async initializeStreak(userId) {
    try {
      const existingStreak = await Streak.findOne({ user_id: userId });
      if (!existingStreak) {
        const streak = new Streak({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          streak_type: 'daily_exercise'
        });
        await streak.save();
        return streak;
      }
      return existingStreak;
    } catch (error) {
      console.error('Error initializing streak:', error);
      throw error;
    }
  }

  async updateStreak(userId, streakType = 'daily_exercise') {
    try {
      const streak = await Streak.findOne({ user_id: userId });
      if (!streak) {
        return await this.initializeStreak(userId);
      }
      
      const today = new Date();
      const lastActivity = streak.last_activity_date;
      
      // Check if this is a new day
      if (!lastActivity || !this.isSameDay(today, lastActivity)) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActivity && this.isSameDay(yesterday, lastActivity)) {
          // Continue streak
          streak.current_streak += 1;
        } else if (!lastActivity || this.daysBetween(lastActivity, today) > 1) {
          // Streak broken, reset
          streak.current_streak = 1;
        }
        
        // Update longest streak
        if (streak.current_streak > streak.longest_streak) {
          streak.longest_streak = streak.current_streak;
        }
        
        streak.last_activity_date = today;
        await streak.save();
        
        // Award streak bonus
        if (streak.current_streak > 1) {
          const streakBonus = this.pointsConfig.streak_bonus * streak.current_streak;
          await this.awardPoints(userId, 'streak_bonus', streakBonus, {
            ar: `مكافأة السلسلة: ${streak.current_streak} أيام`,
            en: `Streak bonus: ${streak.current_streak} days`
          });
        }
        
        // Check streak achievements
        await this.checkStreakAchievements(userId, streak.current_streak);
      }
      
      return streak;
    } catch (error) {
      console.error('Error updating streak:', error);
      throw error;
    }
  }

  // Achievement system
  async checkAndAwardAchievement(userId, achievementId) {
    try {
      const achievement = await Achievement.findOne({ id: achievementId, is_active: true });
      if (!achievement) {
        return null;
      }
      
      // Check if user already has this achievement
      const existingUserAchievement = await UserAchievement.findOne({
        user_id: userId,
        achievement_id: achievementId
      });
      
      if (existingUserAchievement && existingUserAchievement.is_completed) {
        return null; // Already earned
      }
      
      // Create or update user achievement
      let userAchievement = existingUserAchievement || new UserAchievement({
        user_id: userId,
        achievement_id: achievementId,
        progress: {
          current: 0,
          target: achievement.criteria.threshold
        }
      });
      
      // Check if criteria is met
      const currentValue = await this.getAchievementProgress(userId, achievement);
      const completed = userAchievement.updateProgress(currentValue);
      
      await userAchievement.save();
      
      if (completed && !userAchievement.is_claimed) {
        await this.awardAchievementRewards(userId, achievement);
        userAchievement.is_claimed = true;
        await userAchievement.save();
        
        // Update user statistics
        const profile = await this.getUserProfile(userId);
        profile.statistics.achievements_earned += 1;
        await profile.save();
        
        return {
          achievement,
          user_achievement: userAchievement,
          newly_earned: true
        };
      }
      
      return {
        achievement,
        user_achievement: userAchievement,
        newly_earned: false
      };
    } catch (error) {
      console.error('Error checking achievement:', error);
      throw error;
    }
  }

  async getAchievementProgress(userId, achievement) {
    try {
      const profile = await this.getUserProfile(userId);
      const metric = achievement.criteria.metric;
      
      switch (metric) {
        case 'exercises_completed':
          return profile.statistics.total_exercises;
        case 'total_points':
          return profile.points.total_earned;
        case 'perfect_sessions':
          return profile.statistics.perfect_sessions;
        case 'consecutive_days':
          const streak = await Streak.findOne({ user_id: userId });
          return streak ? streak.current_streak : 0;
        case 'level_advancement':
          return profile.level.current;
        case 'accuracy_rate':
          // Calculate overall accuracy from sessions
          const sessions = await Session.find({ user_id: userId });
          if (sessions.length === 0) return 0;
          const totalAccuracy = sessions.reduce((sum, session) => sum + session.results.accuracy, 0);
          return Math.round(totalAccuracy / sessions.length);
        default:
          return 0;
      }
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return 0;
    }
  }

  async awardAchievementRewards(userId, achievement) {
    try {
      const rewards = achievement.rewards;
      
      // Award points
      if (rewards.points > 0) {
        await this.awardPoints(userId, 'achievement', rewards.points, {
          ar: `إنجاز: ${achievement.name.ar}`,
          en: `Achievement: ${achievement.name.en}`
        });
      }
      
      // Award special items
      if (rewards.special_feature) {
        const profile = await this.getUserProfile(userId);
        
        switch (rewards.special_feature) {
          case 'bonus_hints':
            profile.inventory.hint_tokens += 5;
            break;
          case 'skip_tokens':
            profile.inventory.skip_tokens += 3;
            break;
          case 'custom_avatar':
            if (!profile.avatar.unlocked.includes(rewards.badge)) {
              profile.avatar.unlocked.push(rewards.badge);
            }
            break;
          case 'special_theme':
            if (!profile.themes.unlocked.includes(achievement.id)) {
              profile.themes.unlocked.push(achievement.id);
            }
            break;
        }
        
        await profile.save();
      }
      
      // Award title
      if (rewards.title) {
        const profile = await this.getUserProfile(userId);
        profile.titles.unlocked.push({
          title: rewards.title,
          unlocked_at: new Date()
        });
        await profile.save();
      }
      
      return true;
    } catch (error) {
      console.error('Error awarding achievement rewards:', error);
      throw error;
    }
  }

  // Challenge system
  async joinChallenge(userId, challengeId) {
    try {
      const challenge = await Challenge.findOne({ id: challengeId, is_active: true });
      if (!challenge) {
        throw new Error('Challenge not found or inactive');
      }
      
      // Check if already participating
      const existingParticipation = await UserChallenge.findOne({
        user_id: userId,
        challenge_id: challengeId
      });
      
      if (existingParticipation) {
        throw new Error('Already participating in this challenge');
      }
      
      // Check participation limit
      if (challenge.participation_limit && challenge.current_participants >= challenge.participation_limit) {
        throw new Error('Challenge participation limit reached');
      }
      
      // Check user requirements
      const user = await User.findById(userId);
      if (challenge.requirements.min_level > user.current_level) {
        throw new Error('User level too low for this challenge');
      }
      
      // Create user challenge
      const userChallenge = new UserChallenge({
        user_id: userId,
        challenge_id: challengeId,
        progress: challenge.objectives.map((obj, index) => ({
          objective_index: index,
          current: 0,
          target: obj.target,
          completed: false
        }))
      });
      
      await userChallenge.save();
      
      // Update challenge participant count
      challenge.current_participants += 1;
      await challenge.save();
      
      return userChallenge;
    } catch (error) {
      console.error('Error joining challenge:', error);
      throw error;
    }
  }

  async updateChallengeProgress(userId, session) {
    try {
      const activeChallenges = await UserChallenge.find({
        user_id: userId,
        status: 'active'
      });
      
      for (const userChallenge of activeChallenges) {
        const challenge = await Challenge.findOne({ id: userChallenge.challenge_id });
        if (!challenge) continue;
        
        let challengeCompleted = true;
        
        for (let i = 0; i < challenge.objectives.length; i++) {
          const objective = challenge.objectives[i];
          const progress = userChallenge.progress[i];
          
          if (!progress.completed) {
            // Update progress based on objective type
            switch (objective.type) {
              case 'complete_exercises':
                progress.current += session.results.total_exercises;
                break;
              case 'achieve_accuracy':
                if (session.results.accuracy >= objective.target) {
                  progress.current = objective.target;
                }
                break;
              case 'complete_time':
                if (session.results.average_time <= objective.target) {
                  progress.current += 1;
                }
                break;
              case 'consecutive_correct':
                // This would need to be tracked during the session
                break;
              case 'no_hints_used':
                if (session.hints_used === 0) {
                  progress.current += 1;
                }
                break;
            }
            
            // Check if objective is completed
            if (progress.current >= progress.target) {
              progress.completed = true;
            } else {
              challengeCompleted = false;
            }
          }
        }
        
        // Check if entire challenge is completed
        if (challengeCompleted && userChallenge.status === 'active') {
          userChallenge.status = 'completed';
          userChallenge.completed_at = new Date();
          
          // Award challenge rewards
          await this.awardChallengeRewards(userId, challenge);
          
          // Update user statistics
          const profile = await this.getUserProfile(userId);
          profile.statistics.challenges_completed += 1;
          await profile.save();
        }
        
        await userChallenge.save();
      }
    } catch (error) {
      console.error('Error updating challenge progress:', error);
      throw error;
    }
  }

  async awardChallengeRewards(userId, challenge) {
    try {
      const rewards = challenge.rewards;
      
      // Award points
      await this.awardPoints(userId, 'challenge_completion', rewards.points, {
        ar: `إكمال التحدي: ${challenge.name.ar}`,
        en: `Challenge completed: ${challenge.name.en}`
      });
      
      // Award items
      if (rewards.items && rewards.items.length > 0) {
        const profile = await this.getUserProfile(userId);
        
        for (const item of rewards.items) {
          switch (item) {
            case 'hint_token':
              profile.inventory.hint_tokens += 3;
              break;
            case 'skip_token':
              profile.inventory.skip_tokens += 2;
              break;
            case 'freeze_token':
              profile.inventory.freeze_tokens += 1;
              break;
            case 'bonus_multiplier':
              profile.inventory.bonus_multipliers += 1;
              break;
          }
        }
        
        await profile.save();
      }
      
      // Award achievement if specified
      if (rewards.achievement_id) {
        await this.checkAndAwardAchievement(userId, rewards.achievement_id);
      }
      
      return true;
    } catch (error) {
      console.error('Error awarding challenge rewards:', error);
      throw error;
    }
  }

  // Leaderboard management
  async updateLeaderboards() {
    try {
      const leaderboardTypes = [
        { type: 'global', period: 'weekly', category: 'points' },
        { type: 'global', period: 'monthly', category: 'points' },
        { type: 'global', period: 'all_time', category: 'points' },
        { type: 'global', period: 'weekly', category: 'accuracy' },
        { type: 'global', period: 'weekly', category: 'streak' }
      ];
      
      for (const config of leaderboardTypes) {
        await this.updateSingleLeaderboard(config);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating leaderboards:', error);
      throw error;
    }
  }

  async updateSingleLeaderboard(config) {
    try {
      const { type, period, category } = config;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = null;
      
      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all_time':
          startDate = new Date(0);
          break;
      }
      
      // Get user data based on category
      let userData = [];
      
      if (category === 'points') {
        const profiles = await UserGamificationProfile.find({})
          .populate('user_id', 'username display_name')
          .sort({ 'points.total_earned': -1 })
          .limit(100);
        
        userData = profiles.map(profile => ({
          user_id: profile.user_id._id,
          score: profile.points.total_earned,
          metadata: {
            accuracy: 0, // Would need to calculate
            speed: 0,
            exercises_completed: profile.statistics.total_exercises,
            streak: 0
          }
        }));
      } else if (category === 'streak') {
        const streaks = await Streak.find({})
          .populate('user_id', 'username display_name')
          .sort({ current_streak: -1 })
          .limit(100);
        
        userData = streaks.map(streak => ({
          user_id: streak.user_id._id,
          score: streak.current_streak,
          metadata: {
            accuracy: 0,
            speed: 0,
            exercises_completed: 0,
            streak: streak.current_streak
          }
        }));
      }
      
      // Add rankings
      const entries = userData.map((user, index) => ({
        ...user,
        rank: index + 1,
        change_from_previous: 0 // Would need to calculate from previous leaderboard
      }));
      
      // Find or create leaderboard
      let leaderboard = await Leaderboard.findOne({ type, period, category });
      
      if (!leaderboard) {
        leaderboard = new Leaderboard({
          type,
          period,
          category,
          entries: [],
          next_update: this.getNextUpdateTime(period)
        });
      }
      
      leaderboard.entries = entries;
      leaderboard.last_updated = now;
      leaderboard.next_update = this.getNextUpdateTime(period);
      
      await leaderboard.save();
      
      return leaderboard;
    } catch (error) {
      console.error('Error updating single leaderboard:', error);
      throw error;
    }
  }

  // Helper methods
  async getUserProfile(userId) {
    let profile = await UserGamificationProfile.findOne({ user_id: userId });
    if (!profile) {
      profile = await this.initializeUserProfile(userId);
    }
    return profile;
  }

  isSameDay(date1, date2) {
    return date1.toDateString() === date2.toDateString();
  }

  daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  }

  getNextUpdateTime(period) {
    const now = new Date();
    switch (period) {
      case 'daily':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow;
      case 'weekly':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay()));
        nextWeek.setHours(0, 0, 0, 0);
        return nextWeek;
      case 'monthly':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  // Achievement checking methods
  async checkPointsAchievements(userId, totalPoints) {
    const pointsMilestones = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000];
    for (const milestone of pointsMilestones) {
      if (totalPoints >= milestone) {
        await this.checkAndAwardAchievement(userId, `points_${milestone}`);
      }
    }
  }

  async checkLevelAchievements(userId, level) {
    const levelMilestones = [5, 10, 15, 20, 25, 30, 40, 50];
    for (const milestone of levelMilestones) {
      if (level >= milestone) {
        await this.checkAndAwardAchievement(userId, `level_${milestone}`);
      }
    }
  }

  async checkStreakAchievements(userId, streak) {
    const streakMilestones = [3, 7, 14, 30, 60, 100, 365];
    for (const milestone of streakMilestones) {
      if (streak >= milestone) {
        await this.checkAndAwardAchievement(userId, `streak_${milestone}`);
      }
    }
  }

  async checkSessionAchievements(userId, session) {
    const results = session.results;
    
    // Perfect accuracy achievement
    if (results.accuracy === 100) {
      await this.checkAndAwardAchievement(userId, 'perfect_accuracy');
    }
    
    // Speed achievements
    if (results.average_time <= 3) {
      await this.checkAndAwardAchievement(userId, 'speed_demon');
    }
    
    // Exercise count achievements
    if (results.total_exercises >= 50) {
      await this.checkAndAwardAchievement(userId, 'marathon_session');
    }
    
    // Check for other session-based achievements
    await this.checkAndAwardAchievement(userId, 'exercises_completed');
    await this.checkAndAwardAchievement(userId, 'perfect_sessions');
  }
}

module.exports = GamificationService;
