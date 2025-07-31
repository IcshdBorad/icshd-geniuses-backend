const GamificationService = require('../services/GamificationService');
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

class GamificationController {
  constructor() {
    this.gamificationService = new GamificationService();
  }

  // Get user gamification profile
  async getUserProfile(req, res) {
    try {
      const userId = req.user.id;
      const profile = await this.gamificationService.getUserProfile(userId);
      
      // Get recent achievements
      const recentAchievements = await UserAchievement.find({
        user_id: userId,
        is_completed: true
      })
      .populate('achievement_id')
      .sort({ earned_at: -1 })
      .limit(5);
      
      // Get current streak
      const streak = await Streak.findOne({ user_id: userId });
      
      // Get active challenges
      const activeChallenges = await UserChallenge.find({
        user_id: userId,
        status: 'active'
      }).limit(3);
      
      // Get recent transactions
      const recentTransactions = await PointsTransaction.find({
        user_id: userId
      })
      .sort({ created_at: -1 })
      .limit(10);
      
      res.json({
        success: true,
        data: {
          profile,
          recent_achievements: recentAchievements,
          current_streak: streak,
          active_challenges: activeChallenges,
          recent_transactions: recentTransactions
        }
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
        error: error.message
      });
    }
  }

  // Get user achievements
  async getUserAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { category, status = 'all', page = 1, limit = 20 } = req.query;
      
      // Build query
      let query = { user_id: userId };
      
      if (status === 'completed') {
        query.is_completed = true;
      } else if (status === 'in_progress') {
        query.is_completed = false;
        query['progress.current'] = { $gt: 0 };
      } else if (status === 'locked') {
        query.is_completed = false;
        query['progress.current'] = 0;
      }
      
      // Get achievements with pagination
      const achievements = await UserAchievement.find(query)
        .sort({ earned_at: -1, 'progress.percentage': -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      // Get achievement details
      const achievementIds = achievements.map(ua => ua.achievement_id);
      const achievementDetails = await Achievement.find({
        id: { $in: achievementIds },
        ...(category && { category })
      });
      
      // Combine data
      const enrichedAchievements = achievements.map(userAchievement => {
        const achievement = achievementDetails.find(a => a.id === userAchievement.achievement_id);
        return {
          ...userAchievement.toObject(),
          achievement_details: achievement
        };
      });
      
      // Get total count
      const totalCount = await UserAchievement.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          achievements: enrichedAchievements,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalCount / limit),
            total_count: totalCount,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting user achievements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get achievements',
        error: error.message
      });
    }
  }

  // Get available achievements
  async getAvailableAchievements(req, res) {
    try {
      const userId = req.user.id;
      const { category } = req.query;
      
      // Get all active achievements
      let query = { is_active: true };
      if (category) {
        query.category = category;
      }
      
      const allAchievements = await Achievement.find(query).sort({ category: 1, type: 1 });
      
      // Get user's achievement progress
      const userAchievements = await UserAchievement.find({ user_id: userId });
      const userAchievementMap = new Map();
      userAchievements.forEach(ua => {
        userAchievementMap.set(ua.achievement_id, ua);
      });
      
      // Combine data
      const enrichedAchievements = await Promise.all(allAchievements.map(async achievement => {
        const userAchievement = userAchievementMap.get(achievement.id);
        
        let progress = {
          current: 0,
          target: achievement.criteria.threshold,
          percentage: 0
        };
        
        let status = 'locked';
        
        if (userAchievement) {
          progress = userAchievement.progress;
          status = userAchievement.is_completed ? 'completed' : 'in_progress';
        } else {
          // Calculate current progress for new achievements
          const currentValue = await this.gamificationService.getAchievementProgress(userId, achievement);
          progress.current = currentValue;
          progress.percentage = Math.min(100, (currentValue / achievement.criteria.threshold) * 100);
          
          if (currentValue > 0) {
            status = 'in_progress';
          }
        }
        
        return {
          ...achievement.toObject(),
          user_progress: progress,
          status,
          earned_at: userAchievement?.earned_at || null,
          is_claimed: userAchievement?.is_claimed || false
        };
      }));
      
      // Group by category
      const groupedAchievements = enrichedAchievements.reduce((groups, achievement) => {
        const category = achievement.category;
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(achievement);
        return groups;
      }, {});
      
      res.json({
        success: true,
        data: {
          achievements: enrichedAchievements,
          grouped_achievements: groupedAchievements,
          categories: Object.keys(groupedAchievements)
        }
      });
    } catch (error) {
      console.error('Error getting available achievements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available achievements',
        error: error.message
      });
    }
  }

  // Claim achievement reward
  async claimAchievementReward(req, res) {
    try {
      const userId = req.user.id;
      const { achievement_id } = req.params;
      
      const userAchievement = await UserAchievement.findOne({
        user_id: userId,
        achievement_id: achievement_id,
        is_completed: true,
        is_claimed: false
      });
      
      if (!userAchievement) {
        return res.status(404).json({
          success: false,
          message: 'Achievement not found or already claimed'
        });
      }
      
      const achievement = await Achievement.findOne({ id: achievement_id });
      if (!achievement) {
        return res.status(404).json({
          success: false,
          message: 'Achievement details not found'
        });
      }
      
      // Award rewards
      await this.gamificationService.awardAchievementRewards(userId, achievement);
      
      // Mark as claimed
      userAchievement.is_claimed = true;
      await userAchievement.save();
      
      res.json({
        success: true,
        message: 'Achievement reward claimed successfully',
        data: {
          achievement,
          rewards: achievement.rewards
        }
      });
    } catch (error) {
      console.error('Error claiming achievement reward:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to claim achievement reward',
        error: error.message
      });
    }
  }

  // Get leaderboards
  async getLeaderboards(req, res) {
    try {
      const { type = 'global', period = 'weekly', category = 'points', limit = 50 } = req.query;
      const userId = req.user.id;
      
      const leaderboard = await Leaderboard.findOne({ type, period, category })
        .populate('entries.user_id', 'username display_name avatar country');
      
      if (!leaderboard) {
        return res.json({
          success: true,
          data: {
            entries: [],
            user_rank: null,
            total_participants: 0,
            last_updated: null
          }
        });
      }
      
      // Limit entries
      const limitedEntries = leaderboard.entries.slice(0, parseInt(limit));
      
      // Find user's rank
      const userRank = leaderboard.entries.findIndex(entry => 
        entry.user_id._id.toString() === userId.toString()
      ) + 1;
      
      // Get user's entry if not in top entries
      let userEntry = null;
      if (userRank > limit) {
        userEntry = leaderboard.entries[userRank - 1];
      }
      
      res.json({
        success: true,
        data: {
          entries: limitedEntries,
          user_rank: userRank || null,
          user_entry: userEntry,
          total_participants: leaderboard.entries.length,
          last_updated: leaderboard.last_updated,
          next_update: leaderboard.next_update
        }
      });
    } catch (error) {
      console.error('Error getting leaderboards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboards',
        error: error.message
      });
    }
  }

  // Get available challenges
  async getAvailableChallenges(req, res) {
    try {
      const userId = req.user.id;
      const { type, difficulty } = req.query;
      
      // Build query for active challenges
      let query = { 
        is_active: true,
        'duration.start_date': { $lte: new Date() },
        'duration.end_date': { $gte: new Date() }
      };
      
      if (type) query.type = type;
      if (difficulty) query.difficulty = difficulty;
      
      const challenges = await Challenge.find(query).sort({ created_at: -1 });
      
      // Get user's participation status
      const userChallenges = await UserChallenge.find({ user_id: userId });
      const userChallengeMap = new Map();
      userChallenges.forEach(uc => {
        userChallengeMap.set(uc.challenge_id, uc);
      });
      
      // Enrich challenges with user data
      const enrichedChallenges = challenges.map(challenge => {
        const userChallenge = userChallengeMap.get(challenge.id);
        
        return {
          ...challenge.toObject(),
          user_participation: userChallenge || null,
          is_participating: !!userChallenge,
          can_join: !userChallenge && (
            !challenge.participation_limit || 
            challenge.current_participants < challenge.participation_limit
          ),
          time_remaining: challenge.duration.end_date - new Date()
        };
      });
      
      res.json({
        success: true,
        data: {
          challenges: enrichedChallenges
        }
      });
    } catch (error) {
      console.error('Error getting available challenges:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available challenges',
        error: error.message
      });
    }
  }

  // Join challenge
  async joinChallenge(req, res) {
    try {
      const userId = req.user.id;
      const { challenge_id } = req.params;
      
      const userChallenge = await this.gamificationService.joinChallenge(userId, challenge_id);
      
      res.json({
        success: true,
        message: 'Successfully joined challenge',
        data: {
          user_challenge: userChallenge
        }
      });
    } catch (error) {
      console.error('Error joining challenge:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to join challenge'
      });
    }
  }

  // Get user challenge progress
  async getUserChallengeProgress(req, res) {
    try {
      const userId = req.user.id;
      const { challenge_id } = req.params;
      
      const userChallenge = await UserChallenge.findOne({
        user_id: userId,
        challenge_id: challenge_id
      });
      
      if (!userChallenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge participation not found'
        });
      }
      
      const challenge = await Challenge.findOne({ id: challenge_id });
      
      res.json({
        success: true,
        data: {
          user_challenge: userChallenge,
          challenge_details: challenge
        }
      });
    } catch (error) {
      console.error('Error getting challenge progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get challenge progress',
        error: error.message
      });
    }
  }

  // Get points history
  async getPointsHistory(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, source } = req.query;
      
      let query = { user_id: userId };
      if (source) {
        query.source = source;
      }
      
      const transactions = await PointsTransaction.find(query)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
      
      const totalCount = await PointsTransaction.countDocuments(query);
      
      // Get summary statistics
      const summary = await PointsTransaction.aggregate([
        { $match: { user_id: userId } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      res.json({
        success: true,
        data: {
          transactions,
          summary,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(totalCount / limit),
            total_count: totalCount,
            per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting points history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get points history',
        error: error.message
      });
    }
  }

  // Use inventory item
  async useInventoryItem(req, res) {
    try {
      const userId = req.user.id;
      const { item_type, session_id } = req.body;
      
      const profile = await this.gamificationService.getUserProfile(userId);
      
      // Check if user has the item
      if (!profile.inventory[item_type] || profile.inventory[item_type] <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Item not available in inventory'
        });
      }
      
      // Deduct item from inventory
      profile.inventory[item_type] -= 1;
      await profile.save();
      
      // Record the usage
      await this.gamificationService.spendPoints(userId, 0, {
        ar: `استخدام ${item_type}`,
        en: `Used ${item_type}`
      }, session_id);
      
      res.json({
        success: true,
        message: 'Item used successfully',
        data: {
          item_type,
          remaining_count: profile.inventory[item_type],
          inventory: profile.inventory
        }
      });
    } catch (error) {
      console.error('Error using inventory item:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to use inventory item',
        error: error.message
      });
    }
  }

  // Update user preferences
  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const { preferences } = req.body;
      
      const profile = await this.gamificationService.getUserProfile(userId);
      
      // Update preferences
      Object.keys(preferences).forEach(key => {
        if (profile.preferences.hasOwnProperty(key)) {
          profile.preferences[key] = preferences[key];
        }
      });
      
      await profile.save();
      
      res.json({
        success: true,
        message: 'Preferences updated successfully',
        data: {
          preferences: profile.preferences
        }
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update preferences',
        error: error.message
      });
    }
  }

  // Update user customization (avatar, theme, title)
  async updateCustomization(req, res) {
    try {
      const userId = req.user.id;
      const { avatar, theme, title } = req.body;
      
      const profile = await this.gamificationService.getUserProfile(userId);
      
      // Update avatar if provided and unlocked
      if (avatar && profile.avatar.unlocked.includes(avatar)) {
        profile.avatar.current = avatar;
      }
      
      // Update theme if provided and unlocked
      if (theme && profile.themes.unlocked.includes(theme)) {
        profile.themes.current = theme;
      }
      
      // Update title if provided and unlocked
      if (title) {
        const unlockedTitle = profile.titles.unlocked.find(t => 
          t.title.ar === title.ar || t.title.en === title.en
        );
        if (unlockedTitle) {
          profile.titles.current = title;
        }
      }
      
      await profile.save();
      
      res.json({
        success: true,
        message: 'Customization updated successfully',
        data: {
          avatar: profile.avatar.current,
          theme: profile.themes.current,
          title: profile.titles.current
        }
      });
    } catch (error) {
      console.error('Error updating customization:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update customization',
        error: error.message
      });
    }
  }

  // Get gamification statistics
  async getGamificationStats(req, res) {
    try {
      const userId = req.user.id;
      
      // Get comprehensive statistics
      const profile = await this.gamificationService.getUserProfile(userId);
      const streak = await Streak.findOne({ user_id: userId });
      
      // Get achievements breakdown
      const achievementStats = await UserAchievement.aggregate([
        { $match: { user_id: userId } },
        {
          $lookup: {
            from: 'achievements',
            localField: 'achievement_id',
            foreignField: 'id',
            as: 'achievement'
          }
        },
        { $unwind: '$achievement' },
        {
          $group: {
            _id: '$achievement.category',
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: ['$is_completed', 1, 0] }
            }
          }
        }
      ]);
      
      // Get points breakdown by source
      const pointsBreakdown = await PointsTransaction.aggregate([
        { $match: { user_id: userId, type: 'earned' } },
        {
          $group: {
            _id: '$source',
            total_points: { $sum: '$amount' },
            transaction_count: { $sum: 1 }
          }
        }
      ]);
      
      // Get recent activity
      const recentActivity = await PointsTransaction.find({ user_id: userId })
        .sort({ created_at: -1 })
        .limit(10)
        .select('type source amount description created_at');
      
      res.json({
        success: true,
        data: {
          profile_summary: {
            level: profile.level.current,
            total_points: profile.points.total_earned,
            current_balance: profile.points.current_balance,
            achievements_earned: profile.statistics.achievements_earned,
            challenges_completed: profile.statistics.challenges_completed,
            current_streak: streak?.current_streak || 0,
            longest_streak: streak?.longest_streak || 0
          },
          achievement_stats: achievementStats,
          points_breakdown: pointsBreakdown,
          recent_activity: recentActivity,
          inventory: profile.inventory,
          customization: {
            avatar: profile.avatar.current,
            theme: profile.themes.current,
            title: profile.titles.current,
            unlocked_avatars: profile.avatar.unlocked,
            unlocked_themes: profile.themes.unlocked,
            unlocked_titles: profile.titles.unlocked
          }
        }
      });
    } catch (error) {
      console.error('Error getting gamification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get gamification statistics',
        error: error.message
      });
    }
  }

  // Admin: Create achievement
  async createAchievement(req, res) {
    try {
      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const achievementData = req.body;
      const achievement = new Achievement(achievementData);
      await achievement.save();
      
      res.json({
        success: true,
        message: 'Achievement created successfully',
        data: { achievement }
      });
    } catch (error) {
      console.error('Error creating achievement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create achievement',
        error: error.message
      });
    }
  }

  // Admin: Create challenge
  async createChallenge(req, res) {
    try {
      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      const challengeData = req.body;
      const challenge = new Challenge(challengeData);
      await challenge.save();
      
      res.json({
        success: true,
        message: 'Challenge created successfully',
        data: { challenge }
      });
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create challenge',
        error: error.message
      });
    }
  }

  // Admin: Update leaderboards
  async updateLeaderboards(req, res) {
    try {
      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }
      
      await this.gamificationService.updateLeaderboards();
      
      res.json({
        success: true,
        message: 'Leaderboards updated successfully'
      });
    } catch (error) {
      console.error('Error updating leaderboards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update leaderboards',
        error: error.message
      });
    }
  }
}

module.exports = GamificationController;
