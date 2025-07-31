/**
 * Promotion Model for ICSHD GENIUSES
 * Tracks student level promotions and achievements
 */

const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const { getConnection, dbType } = require('../config/database');

// MongoDB Schema (Mongoose)
const mongoPromotionSchema = new mongoose.Schema({
  promotionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `PROM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    }
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentCode: {
    type: String,
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Promotion Details
  curriculum: {
    type: String,
    enum: ['soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'],
    required: true
  },
  fromLevel: {
    type: String,
    required: true
  },
  toLevel: {
    type: String,
    required: true
  },
  promotionType: {
    type: String,
    enum: ['automatic', 'manual', 'assessment'],
    default: 'automatic'
  },
  // Promotion Criteria Met
  criteriaData: {
    averageAccuracy: {
      type: Number,
      required: true
    },
    averageTime: {
      type: Number,
      required: true
    },
    consecutiveSuccessfulSessions: {
      type: Number,
      required: true
    },
    totalSessionsAtLevel: {
      type: Number,
      required: true
    },
    lastSessionIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    }]
  },
  // Promotion Requirements
  requirements: {
    minimumAccuracy: {
      type: Number,
      default: 85
    },
    maximumAverageTime: {
      type: Number,
      default: 6
    },
    requiredSuccessfulSessions: {
      type: Number,
      default: 3
    }
  },
  // Promotion Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto_approved'],
    default: 'pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Approval Details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: Date,
  rejectionReason: String,
  // Performance Summary
  performanceSummary: {
    totalExercisesSolved: Number,
    totalCorrectAnswers: Number,
    overallAccuracy: Number,
    averageSessionTime: Number,
    strongAreas: [String],
    improvementAreas: [String],
    achievements: [{
      type: String,
      earnedAt: Date,
      description: String
    }]
  },
  // Notification Status
  notificationSent: {
    student: {
      type: Boolean,
      default: false
    },
    trainer: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  },
  // Additional Data
  notes: String,
  celebrationMessage: String,
  nextLevelPreview: {
    description: String,
    expectedDifficulty: String,
    newFeatures: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
mongoPromotionSchema.virtual('promotionAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // days
});

mongoPromotionSchema.virtual('isEligible').get(function() {
  const criteria = this.criteriaData;
  const requirements = this.requirements;
  
  return criteria.averageAccuracy >= requirements.minimumAccuracy &&
         criteria.averageTime <= requirements.maximumAverageTime &&
         criteria.consecutiveSuccessfulSessions >= requirements.requiredSuccessfulSessions;
});

// Instance methods
mongoPromotionSchema.methods.approve = function(approvedBy, notes = '') {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvedAt = new Date();
  this.notes = notes;
  return this.save();
};

mongoPromotionSchema.methods.reject = function(rejectedBy, reason) {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

mongoPromotionSchema.methods.autoApprove = function() {
  this.status = 'auto_approved';
  this.approvedAt = new Date();
  return this.save();
};

// Static methods
mongoPromotionSchema.statics.findPendingPromotions = function(trainerId = null) {
  const query = { status: 'pending' };
  if (trainerId) {
    query.trainerId = trainerId;
  }
  return this.find(query).populate('studentId trainerId');
};

mongoPromotionSchema.statics.getStudentPromotionHistory = function(studentId) {
  return this.find({ studentId })
    .sort({ createdAt: -1 })
    .populate('trainerId', 'profile.firstName profile.lastName');
};

mongoPromotionSchema.statics.checkPromotionEligibility = async function(studentId, curriculum) {
  // Get recent sessions for the student in this curriculum
  const Session = mongoose.model('Session');
  const recentSessions = await Session.find({
    studentId,
    curriculum,
    result: { $in: ['excellent', 'good'] }
  })
  .sort({ createdAt: -1 })
  .limit(5);

  if (recentSessions.length < 3) {
    return { eligible: false, reason: 'Insufficient successful sessions' };
  }

  // Calculate averages
  const totalAccuracy = recentSessions.reduce((sum, session) => sum + session.accuracy, 0);
  const totalTime = recentSessions.reduce((sum, session) => sum + session.averageTimePerQuestion, 0);
  
  const avgAccuracy = totalAccuracy / recentSessions.length;
  const avgTime = totalTime / recentSessions.length;

  // Check if last 3 sessions are consecutive successes
  const lastThree = recentSessions.slice(0, 3);
  const consecutiveSuccess = lastThree.every(session => 
    session.accuracy >= 85 && session.averageTimePerQuestion <= 6
  );

  return {
    eligible: avgAccuracy >= 85 && avgTime <= 6 && consecutiveSuccess,
    data: {
      averageAccuracy: Math.round(avgAccuracy),
      averageTime: Math.round(avgTime * 100) / 100,
      consecutiveSuccessfulSessions: consecutiveSuccess ? 3 : 0,
      sessionIds: recentSessions.map(s => s._id)
    }
  };
};

// MySQL Model (Sequelize)
const createMySQLPromotionModel = (sequelize) => {
  const Promotion = sequelize.define('Promotion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    promotionId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    studentCode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    trainerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    curriculum: {
      type: DataTypes.ENUM('soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'),
      allowNull: false
    },
    fromLevel: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    toLevel: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    promotionType: {
      type: DataTypes.ENUM('automatic', 'manual', 'assessment'),
      defaultValue: 'automatic'
    },
    criteriaData: {
      type: DataTypes.JSON,
      allowNull: false
    },
    requirements: {
      type: DataTypes.JSON
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'auto_approved'),
      defaultValue: 'pending'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    approvedAt: DataTypes.DATE,
    rejectedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rejectedAt: DataTypes.DATE,
    rejectionReason: DataTypes.TEXT,
    performanceSummary: {
      type: DataTypes.JSON
    },
    notificationSent: {
      type: DataTypes.JSON
    },
    notes: DataTypes.TEXT,
    celebrationMessage: DataTypes.TEXT,
    nextLevelPreview: {
      type: DataTypes.JSON
    }
  }, {
    tableName: 'promotions'
  });

  // Instance methods for MySQL
  Promotion.prototype.approve = function(approvedBy, notes = '') {
    this.status = 'approved';
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.notes = notes;
    return this.save();
  };

  Promotion.prototype.reject = function(rejectedBy, reason) {
    this.status = 'rejected';
    this.rejectedBy = rejectedBy;
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    return this.save();
  };

  return Promotion;
};

// Export appropriate model based on database type
let PromotionModel;

if (dbType === 'mongodb') {
  PromotionModel = mongoose.model('Promotion', mongoPromotionSchema);
} else if (dbType === 'mysql') {
  const sequelize = getConnection();
  PromotionModel = createMySQLPromotionModel(sequelize);
}

module.exports = PromotionModel;
