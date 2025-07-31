const express = require('express');
const router = express.Router();
const GamificationController = require('../controllers/GamificationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Initialize controller
const gamificationController = new GamificationController();

// Validation schemas
const achievementValidation = [
  body('id').notEmpty().withMessage('Achievement ID is required'),
  body('name.ar').notEmpty().withMessage('Arabic name is required'),
  body('name.en').notEmpty().withMessage('English name is required'),
  body('description.ar').notEmpty().withMessage('Arabic description is required'),
  body('description.en').notEmpty().withMessage('English description is required'),
  body('category').isIn(['accuracy', 'speed', 'consistency', 'progression', 'special', 'social']).withMessage('Invalid category'),
  body('type').isIn(['bronze', 'silver', 'gold', 'platinum', 'diamond']).withMessage('Invalid type'),
  body('criteria.metric').isIn(['exercises_completed', 'accuracy_rate', 'speed_improvement', 'consecutive_days', 'level_advancement', 'perfect_sessions', 'total_points', 'streak_count']).withMessage('Invalid metric'),
  body('criteria.threshold').isNumeric().withMessage('Threshold must be a number')
];

const challengeValidation = [
  body('id').notEmpty().withMessage('Challenge ID is required'),
  body('name.ar').notEmpty().withMessage('Arabic name is required'),
  body('name.en').notEmpty().withMessage('English name is required'),
  body('type').isIn(['daily', 'weekly', 'monthly', 'special', 'community']).withMessage('Invalid type'),
  body('difficulty').isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty'),
  body('duration.start_date').isISO8601().withMessage('Invalid start date'),
  body('duration.end_date').isISO8601().withMessage('Invalid end date'),
  body('rewards.points').isNumeric().withMessage('Points must be a number')
];

const preferencesValidation = [
  body('preferences').isObject().withMessage('Preferences must be an object'),
  body('preferences.show_leaderboard').optional().isBoolean().withMessage('show_leaderboard must be boolean'),
  body('preferences.receive_challenge_notifications').optional().isBoolean().withMessage('receive_challenge_notifications must be boolean'),
  body('preferences.public_profile').optional().isBoolean().withMessage('public_profile must be boolean')
];

const customizationValidation = [
  body('avatar').optional().isString().withMessage('Avatar must be a string'),
  body('theme').optional().isString().withMessage('Theme must be a string'),
  body('title').optional().isObject().withMessage('Title must be an object'),
  body('title.ar').optional().isString().withMessage('Arabic title must be a string'),
  body('title.en').optional().isString().withMessage('English title must be a string')
];

const inventoryValidation = [
  body('item_type').isIn(['hint_tokens', 'skip_tokens', 'freeze_tokens', 'bonus_multipliers']).withMessage('Invalid item type'),
  body('session_id').optional().isMongoId().withMessage('Invalid session ID')
];

// User Profile Routes
router.get('/profile', 
  authenticateToken, 
  gamificationController.getUserProfile.bind(gamificationController)
);

router.get('/stats', 
  authenticateToken, 
  gamificationController.getGamificationStats.bind(gamificationController)
);

// Achievement Routes
router.get('/achievements', 
  authenticateToken,
  [
    query('category').optional().isIn(['accuracy', 'speed', 'consistency', 'progression', 'special', 'social']).withMessage('Invalid category'),
    query('status').optional().isIn(['all', 'completed', 'in_progress', 'locked']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  gamificationController.getUserAchievements.bind(gamificationController)
);

router.get('/achievements/available', 
  authenticateToken,
  [
    query('category').optional().isIn(['accuracy', 'speed', 'consistency', 'progression', 'special', 'social']).withMessage('Invalid category')
  ],
  validateRequest,
  gamificationController.getAvailableAchievements.bind(gamificationController)
);

router.post('/achievements/:achievement_id/claim', 
  authenticateToken,
  [
    param('achievement_id').notEmpty().withMessage('Achievement ID is required')
  ],
  validateRequest,
  gamificationController.claimAchievementReward.bind(gamificationController)
);

// Leaderboard Routes
router.get('/leaderboards', 
  authenticateToken,
  [
    query('type').optional().isIn(['global', 'curriculum', 'level', 'age_group', 'country']).withMessage('Invalid leaderboard type'),
    query('period').optional().isIn(['daily', 'weekly', 'monthly', 'all_time']).withMessage('Invalid period'),
    query('category').optional().isIn(['points', 'accuracy', 'speed', 'streak', 'exercises_completed']).withMessage('Invalid category'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  gamificationController.getLeaderboards.bind(gamificationController)
);

// Challenge Routes
router.get('/challenges', 
  authenticateToken,
  [
    query('type').optional().isIn(['daily', 'weekly', 'monthly', 'special', 'community']).withMessage('Invalid challenge type'),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard', 'expert']).withMessage('Invalid difficulty')
  ],
  validateRequest,
  gamificationController.getAvailableChallenges.bind(gamificationController)
);

router.post('/challenges/:challenge_id/join', 
  authenticateToken,
  [
    param('challenge_id').notEmpty().withMessage('Challenge ID is required')
  ],
  validateRequest,
  gamificationController.joinChallenge.bind(gamificationController)
);

router.get('/challenges/:challenge_id/progress', 
  authenticateToken,
  [
    param('challenge_id').notEmpty().withMessage('Challenge ID is required')
  ],
  validateRequest,
  gamificationController.getUserChallengeProgress.bind(gamificationController)
);

// Points and Transactions Routes
router.get('/points/history', 
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('source').optional().isIn(['exercise_completion', 'achievement', 'daily_bonus', 'streak_bonus', 'perfect_session', 'level_up', 'challenge_completion', 'referral', 'purchase', 'admin_adjustment']).withMessage('Invalid source')
  ],
  validateRequest,
  gamificationController.getPointsHistory.bind(gamificationController)
);

// Inventory Routes
router.post('/inventory/use', 
  authenticateToken,
  inventoryValidation,
  validateRequest,
  gamificationController.useInventoryItem.bind(gamificationController)
);

// User Preferences Routes
router.put('/preferences', 
  authenticateToken,
  preferencesValidation,
  validateRequest,
  gamificationController.updatePreferences.bind(gamificationController)
);

// Customization Routes
router.put('/customization', 
  authenticateToken,
  customizationValidation,
  validateRequest,
  gamificationController.updateCustomization.bind(gamificationController)
);

// Admin Routes
router.post('/admin/achievements', 
  authenticateToken,
  authorizeRole(['admin']),
  achievementValidation,
  validateRequest,
  gamificationController.createAchievement.bind(gamificationController)
);

router.post('/admin/challenges', 
  authenticateToken,
  authorizeRole(['admin']),
  challengeValidation,
  validateRequest,
  gamificationController.createChallenge.bind(gamificationController)
);

router.post('/admin/leaderboards/update', 
  authenticateToken,
  authorizeRole(['admin']),
  gamificationController.updateLeaderboards.bind(gamificationController)
);

// Additional utility routes

// Get achievement categories
router.get('/achievements/categories', 
  authenticateToken,
  async (req, res) => {
    try {
      const categories = [
        {
          id: 'accuracy',
          name: { ar: 'الدقة', en: 'Accuracy' },
          description: { ar: 'إنجازات متعلقة بدقة الإجابات', en: 'Achievements related to answer accuracy' },
          icon: 'target'
        },
        {
          id: 'speed',
          name: { ar: 'السرعة', en: 'Speed' },
          description: { ar: 'إنجازات متعلقة بسرعة الحل', en: 'Achievements related to solving speed' },
          icon: 'flash'
        },
        {
          id: 'consistency',
          name: { ar: 'الثبات', en: 'Consistency' },
          description: { ar: 'إنجازات متعلقة بالثبات والانتظام', en: 'Achievements related to consistency and regularity' },
          icon: 'trending-up'
        },
        {
          id: 'progression',
          name: { ar: 'التقدم', en: 'Progression' },
          description: { ar: 'إنجازات متعلقة بالتقدم في المستويات', en: 'Achievements related to level progression' },
          icon: 'arrow-up'
        },
        {
          id: 'special',
          name: { ar: 'خاص', en: 'Special' },
          description: { ar: 'إنجازات خاصة ونادرة', en: 'Special and rare achievements' },
          icon: 'star'
        },
        {
          id: 'social',
          name: { ar: 'اجتماعي', en: 'Social' },
          description: { ar: 'إنجازات متعلقة بالتفاعل الاجتماعي', en: 'Achievements related to social interaction' },
          icon: 'users'
        }
      ];

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get achievement categories',
        error: error.message
      });
    }
  }
);

// Get challenge types
router.get('/challenges/types', 
  authenticateToken,
  async (req, res) => {
    try {
      const types = [
        {
          id: 'daily',
          name: { ar: 'يومي', en: 'Daily' },
          description: { ar: 'تحديات يومية تتجدد كل يوم', en: 'Daily challenges that refresh every day' },
          duration: '24 hours',
          icon: 'calendar'
        },
        {
          id: 'weekly',
          name: { ar: 'أسبوعي', en: 'Weekly' },
          description: { ar: 'تحديات أسبوعية تتجدد كل أسبوع', en: 'Weekly challenges that refresh every week' },
          duration: '7 days',
          icon: 'calendar-week'
        },
        {
          id: 'monthly',
          name: { ar: 'شهري', en: 'Monthly' },
          description: { ar: 'تحديات شهرية تتجدد كل شهر', en: 'Monthly challenges that refresh every month' },
          duration: '30 days',
          icon: 'calendar-month'
        },
        {
          id: 'special',
          name: { ar: 'خاص', en: 'Special' },
          description: { ar: 'تحديات خاصة لفترات محدودة', en: 'Special challenges for limited time' },
          duration: 'Variable',
          icon: 'gift'
        },
        {
          id: 'community',
          name: { ar: 'مجتمعي', en: 'Community' },
          description: { ar: 'تحديات جماعية للمجتمع', en: 'Community-wide challenges' },
          duration: 'Variable',
          icon: 'users'
        }
      ];

      res.json({
        success: true,
        data: { types }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get challenge types',
        error: error.message
      });
    }
  }
);

// Get leaderboard types
router.get('/leaderboards/types', 
  authenticateToken,
  async (req, res) => {
    try {
      const types = [
        {
          type: 'global',
          periods: ['daily', 'weekly', 'monthly', 'all_time'],
          categories: ['points', 'accuracy', 'speed', 'streak', 'exercises_completed'],
          name: { ar: 'عالمي', en: 'Global' },
          description: { ar: 'ترتيب عالمي لجميع المستخدمين', en: 'Global ranking for all users' }
        },
        {
          type: 'curriculum',
          periods: ['weekly', 'monthly', 'all_time'],
          categories: ['points', 'accuracy', 'speed'],
          name: { ar: 'حسب المنهج', en: 'By Curriculum' },
          description: { ar: 'ترتيب حسب نوع المنهج', en: 'Ranking by curriculum type' }
        },
        {
          type: 'level',
          periods: ['weekly', 'monthly'],
          categories: ['points', 'accuracy'],
          name: { ar: 'حسب المستوى', en: 'By Level' },
          description: { ar: 'ترتيب حسب المستوى الحالي', en: 'Ranking by current level' }
        },
        {
          type: 'age_group',
          periods: ['monthly', 'all_time'],
          categories: ['points', 'accuracy'],
          name: { ar: 'حسب الفئة العمرية', en: 'By Age Group' },
          description: { ar: 'ترتيب حسب الفئة العمرية', en: 'Ranking by age group' }
        }
      ];

      res.json({
        success: true,
        data: { types }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get leaderboard types',
        error: error.message
      });
    }
  }
);

// Get user rank in specific leaderboard
router.get('/leaderboards/:type/:period/:category/rank', 
  authenticateToken,
  [
    param('type').isIn(['global', 'curriculum', 'level', 'age_group', 'country']).withMessage('Invalid leaderboard type'),
    param('period').isIn(['daily', 'weekly', 'monthly', 'all_time']).withMessage('Invalid period'),
    param('category').isIn(['points', 'accuracy', 'speed', 'streak', 'exercises_completed']).withMessage('Invalid category')
  ],
  validateRequest,
  async (req, res) => {
    try {
      const { type, period, category } = req.params;
      const userId = req.user.id;

      const leaderboard = await Leaderboard.findOne({ type, period, category });
      
      if (!leaderboard) {
        return res.json({
          success: true,
          data: {
            rank: null,
            total_participants: 0,
            score: 0,
            percentile: null
          }
        });
      }

      const userRank = leaderboard.entries.findIndex(entry => 
        entry.user_id.toString() === userId.toString()
      ) + 1;

      const userEntry = leaderboard.entries[userRank - 1];
      const totalParticipants = leaderboard.entries.length;
      const percentile = userRank > 0 ? Math.round(((totalParticipants - userRank + 1) / totalParticipants) * 100) : null;

      res.json({
        success: true,
        data: {
          rank: userRank || null,
          total_participants: totalParticipants,
          score: userEntry?.score || 0,
          percentile: percentile,
          metadata: userEntry?.metadata || {}
        }
      });
    } catch (error) {
      console.error('Error getting user rank:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user rank',
        error: error.message
      });
    }
  }
);

module.exports = router;
