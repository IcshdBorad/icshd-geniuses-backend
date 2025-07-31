const mongoose = require('mongoose');

// Achievement Schema - نظام الإنجازات
const achievementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  description: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['accuracy', 'speed', 'consistency', 'progression', 'special', 'social'],
    required: true
  },
  type: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
    required: true
  },
  criteria: {
    metric: {
      type: String,
      enum: ['exercises_completed', 'accuracy_rate', 'speed_improvement', 'consecutive_days', 'level_advancement', 'perfect_sessions', 'total_points', 'streak_count'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    timeframe: {
      type: String,
      enum: ['session', 'daily', 'weekly', 'monthly', 'all_time'],
      default: 'all_time'
    }
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badge: {
      type: String
    },
    title: {
      ar: String,
      en: String
    },
    special_feature: {
      type: String,
      enum: ['custom_avatar', 'special_theme', 'bonus_hints', 'skip_tokens']
    }
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// User Achievement Schema - إنجازات المستخدم
const userAchievementSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  achievement_id: {
    type: String,
    required: true
  },
  earned_at: {
    type: Date,
    default: Date.now
  },
  progress: {
    current: {
      type: Number,
      default: 0
    },
    target: {
      type: Number,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  is_completed: {
    type: Boolean,
    default: false
  },
  is_claimed: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Points System Schema - نظام النقاط
const pointsTransactionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'bonus', 'penalty', 'gift'],
    required: true
  },
  source: {
    type: String,
    enum: ['exercise_completion', 'achievement', 'daily_bonus', 'streak_bonus', 'perfect_session', 'level_up', 'challenge_completion', 'referral', 'purchase', 'admin_adjustment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balance_after: {
    type: Number,
    required: true
  },
  description: {
    ar: String,
    en: String
  },
  related_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Streak System Schema - نظام السلاسل
const streakSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  current_streak: {
    type: Number,
    default: 0
  },
  longest_streak: {
    type: Number,
    default: 0
  },
  last_activity_date: {
    type: Date
  },
  streak_type: {
    type: String,
    enum: ['daily_login', 'daily_exercise', 'perfect_sessions'],
    default: 'daily_exercise'
  },
  milestones: [{
    days: Number,
    achieved_at: Date,
    reward_claimed: {
      type: Boolean,
      default: false
    }
  }],
  freeze_tokens: {
    type: Number,
    default: 0
  },
  last_freeze_used: {
    type: Date
  }
});

// Challenge System Schema - نظام التحديات
const challengeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  description: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special', 'community'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    required: true
  },
  requirements: {
    curriculum: [String],
    min_level: {
      type: Number,
      default: 1
    },
    max_level: {
      type: Number,
      default: 10
    }
  },
  objectives: [{
    type: {
      type: String,
      enum: ['complete_exercises', 'achieve_accuracy', 'complete_time', 'consecutive_correct', 'no_hints_used'],
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    description: {
      ar: String,
      en: String
    }
  }],
  rewards: {
    points: {
      type: Number,
      required: true
    },
    items: [{
      type: String,
      enum: ['hint_token', 'skip_token', 'freeze_token', 'bonus_multiplier', 'custom_avatar', 'special_theme']
    }],
    achievement_id: String
  },
  duration: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
    auto_renew: {
      type: Boolean,
      default: false
    }
  },
  participation_limit: {
    type: Number,
    default: null // null = unlimited
  },
  current_participants: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// User Challenge Progress Schema - تقدم المستخدم في التحديات
const userChallengeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challenge_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed', 'abandoned'],
    default: 'active'
  },
  progress: [{
    objective_index: Number,
    current: Number,
    target: Number,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  started_at: {
    type: Date,
    default: Date.now
  },
  completed_at: {
    type: Date
  },
  rewards_claimed: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
});

// Leaderboard Schema - لوحة المتصدرين
const leaderboardSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['global', 'curriculum', 'level', 'age_group', 'country'],
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'all_time'],
    required: true
  },
  category: {
    type: String,
    enum: ['points', 'accuracy', 'speed', 'streak', 'exercises_completed'],
    required: true
  },
  filters: {
    curriculum: String,
    level: Number,
    age_group: String,
    country: String
  },
  entries: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rank: {
      type: Number,
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    change_from_previous: {
      type: Number,
      default: 0
    },
    metadata: {
      accuracy: Number,
      speed: Number,
      exercises_completed: Number,
      streak: Number
    }
  }],
  last_updated: {
    type: Date,
    default: Date.now
  },
  next_update: {
    type: Date,
    required: true
  }
});

// User Profile Gamification Schema - ملف المستخدم التحفيزي
const userGamificationProfileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  level: {
    current: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    experience_to_next: {
      type: Number,
      default: 100
    }
  },
  points: {
    total_earned: {
      type: Number,
      default: 0
    },
    current_balance: {
      type: Number,
      default: 0
    },
    lifetime_spent: {
      type: Number,
      default: 0
    }
  },
  titles: {
    current: {
      ar: String,
      en: String
    },
    unlocked: [{
      title: {
        ar: String,
        en: String
      },
      unlocked_at: Date
    }]
  },
  avatar: {
    current: {
      type: String,
      default: 'default'
    },
    unlocked: [String]
  },
  themes: {
    current: {
      type: String,
      default: 'default'
    },
    unlocked: [String]
  },
  inventory: {
    hint_tokens: {
      type: Number,
      default: 3
    },
    skip_tokens: {
      type: Number,
      default: 1
    },
    freeze_tokens: {
      type: Number,
      default: 0
    },
    bonus_multipliers: {
      type: Number,
      default: 0
    }
  },
  statistics: {
    total_sessions: {
      type: Number,
      default: 0
    },
    total_exercises: {
      type: Number,
      default: 0
    },
    perfect_sessions: {
      type: Number,
      default: 0
    },
    achievements_earned: {
      type: Number,
      default: 0
    },
    challenges_completed: {
      type: Number,
      default: 0
    },
    best_streak: {
      type: Number,
      default: 0
    }
  },
  preferences: {
    show_leaderboard: {
      type: Boolean,
      default: true
    },
    receive_challenge_notifications: {
      type: Boolean,
      default: true
    },
    public_profile: {
      type: Boolean,
      default: true
    }
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
achievementSchema.index({ category: 1, type: 1 });
userAchievementSchema.index({ user_id: 1, achievement_id: 1 }, { unique: true });
userAchievementSchema.index({ user_id: 1, is_completed: 1 });
pointsTransactionSchema.index({ user_id: 1, created_at: -1 });
streakSchema.index({ user_id: 1 });
challengeSchema.index({ type: 1, is_active: 1 });
challengeSchema.index({ 'duration.start_date': 1, 'duration.end_date': 1 });
userChallengeSchema.index({ user_id: 1, challenge_id: 1 }, { unique: true });
userChallengeSchema.index({ user_id: 1, status: 1 });
leaderboardSchema.index({ type: 1, period: 1, category: 1 });
userGamificationProfileSchema.index({ user_id: 1 });

// Pre-save middleware
userGamificationProfileSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Methods for calculating experience and levels
userGamificationProfileSchema.methods.addExperience = function(amount) {
  this.level.experience += amount;

  // Check for level up
  while (this.level.experience >= this.level.experience_to_next) {
    this.level.experience -= this.level.experience_to_next;
    this.level.current += 1;
    this.level.experience_to_next = this.calculateExperienceToNext();
  }

  return this.level.current;
};

userGamificationProfileSchema.methods.calculateExperienceToNext = function() {
  // Exponential growth formula: base * (level ^ exponent)
  const base = 100;
  const exponent = 1.5;
  return Math.floor(base * Math.pow(this.level.current, exponent));
};

// Achievement progress calculation
userAchievementSchema.methods.updateProgress = function(currentValue) {
  this.progress.current = currentValue;
  this.progress.percentage = Math.min(100, (currentValue / this.progress.target) * 100);

  if (currentValue >= this.progress.target && !this.is_completed) {
    this.is_completed = true;
    this.earned_at = new Date();
  }

  return this.is_completed;
};

// Export models
const Achievement = mongoose.model('Achievement', achievementSchema);
const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
const PointsTransaction = mongoose.model('PointsTransaction', pointsTransactionSchema);
const Streak = mongoose.model('Streak', streakSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);
const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
const UserGamificationProfile = mongoose.model('UserGamificationProfile', userGamificationProfileSchema);

module.exports = {
  Achievement,
  UserAchievement,
  PointsTransaction,
  Streak,
  Challenge,
  UserChallenge,
  Leaderboard,
  UserGamificationProfile
};