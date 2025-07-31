/**
 * AdaptiveData Model for ICSHD GENIUSES
 * Stores adaptive learning data and patterns for each student
 */

const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const { getConnection, dbType } = require('../config/database');

// MongoDB Schema (Mongoose)
const mongoAdaptiveDataSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentCode: {
    type: String,
    required: true
  },
  curriculum: {
    type: String,
    enum: ['soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'],
    required: true
  },
  level: {
    type: String,
    required: true
  },
  // Learning Profile
  learningProfile: {
    preferredDifficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    learningSpeed: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    },
    attentionSpan: {
      type: Number, // in minutes
      default: 15
    },
    optimalSessionLength: {
      type: Number, // in minutes
      default: 20
    },
    bestPerformanceTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      default: 'morning'
    }
  },
  // Performance Patterns
  performancePatterns: {
    strongAreas: [{
      category: String,
      subcategory: String,
      accuracy: Number,
      averageTime: Number,
      confidence: Number // 0-1
    }],
    weakAreas: [{
      category: String,
      subcategory: String,
      accuracy: Number,
      averageTime: Number,
      attempts: Number,
      lastImprovement: Date
    }],
    consistencyScore: {
      type: Number, // 0-100
      default: 50
    },
    progressTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    }
  },
  // Error Analysis
  errorPatterns: {
    commonMistakes: [{
      type: String,
      frequency: Number,
      lastOccurrence: Date,
      examples: [String]
    }],
    errorTypes: {
      calculation: Number,
      conceptual: Number,
      careless: Number,
      time_pressure: Number
    },
    improvementStrategies: [{
      strategy: String,
      effectiveness: Number, // 0-1
      lastApplied: Date
    }]
  },
  // Adaptive Adjustments History
  adjustmentHistory: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session'
    },
    adjustmentType: {
      type: String,
      enum: ['difficulty', 'time', 'content', 'format']
    },
    fromValue: mongoose.Schema.Types.Mixed,
    toValue: mongoose.Schema.Types.Mixed,
    reason: String,
    effectiveness: Number, // measured in next sessions
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Current Adaptive Settings
  currentSettings: {
    difficultyMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    timeMultiplier: {
      type: Number,
      default: 1.0,
      min: 0.5,
      max: 2.0
    },
    hintFrequency: {
      type: String,
      enum: ['never', 'rare', 'normal', 'frequent'],
      default: 'normal'
    },
    exerciseVariety: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    focusAreas: [String], // Areas to focus on in next sessions
    avoidAreas: [String] // Areas to temporarily avoid
  },
  // Motivation and Engagement
  motivationData: {
    engagementLevel: {
      type: Number, // 0-100
      default: 50
    },
    motivationFactors: [{
      factor: String, // e.g., 'competition', 'achievement', 'progress'
      effectiveness: Number // 0-1
    }],
    preferredRewards: [String],
    streakData: {
      currentStreak: {
        type: Number,
        default: 0
      },
      longestStreak: {
        type: Number,
        default: 0
      },
      lastSessionDate: Date
    }
  },
  // Prediction Models
  predictions: {
    nextSessionPerformance: {
      expectedAccuracy: Number,
      expectedTime: Number,
      confidence: Number,
      lastUpdated: Date
    },
    promotionReadiness: {
      probability: Number, // 0-1
      estimatedSessions: Number,
      confidence: Number,
      lastUpdated: Date
    },
    riskFactors: [{
      factor: String,
      probability: Number,
      severity: String // 'low', 'medium', 'high'
    }]
  },
  // Recommendations
  recommendations: {
    immediate: [{
      type: String,
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      applied: {
        type: Boolean,
        default: false
      }
    }],
    longTerm: [{
      goal: String,
      strategy: String,
      timeline: String,
      milestones: [String]
    }]
  },
  // Data Quality and Confidence
  dataQuality: {
    sampleSize: {
      type: Number,
      default: 0
    },
    confidenceLevel: {
      type: Number, // 0-1
      default: 0
    },
    lastAnalysis: Date,
    dataCompleteness: {
      type: Number, // 0-1
      default: 0
    }
  },
  // Settings
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better performance
mongoAdaptiveDataSchema.index({ studentId: 1, curriculum: 1 }, { unique: true });
mongoAdaptiveDataSchema.index({ studentCode: 1, curriculum: 1 });
mongoAdaptiveDataSchema.index({ lastUpdated: 1 });

// Virtual fields
mongoAdaptiveDataSchema.virtual('overallPerformance').get(function() {
  const strong = this.performancePatterns.strongAreas.length;
  const weak = this.performancePatterns.weakAreas.length;
  const total = strong + weak;
  
  if (total === 0) return 50;
  return Math.round((strong / total) * 100);
});

mongoAdaptiveDataSchema.virtual('adaptationScore').get(function() {
  // Calculate how well the system has adapted to this student
  const adjustments = this.adjustmentHistory.length;
  const effectiveness = this.adjustmentHistory.reduce((sum, adj) => sum + (adj.effectiveness || 0), 0);
  
  if (adjustments === 0) return 0;
  return Math.round((effectiveness / adjustments) * 100);
});

// Instance methods
mongoAdaptiveDataSchema.methods.updatePerformancePattern = function(category, subcategory, isCorrect, timeSpent) {
  const accuracy = isCorrect ? 100 : 0;
  
  // Find existing pattern or create new one
  let pattern = this.performancePatterns.strongAreas.find(p => 
    p.category === category && p.subcategory === subcategory
  );
  
  if (!pattern) {
    pattern = this.performancePatterns.weakAreas.find(p => 
      p.category === category && p.subcategory === subcategory
    );
  }
  
  if (pattern) {
    // Update existing pattern
    const totalAttempts = pattern.attempts || 1;
    pattern.accuracy = Math.round(((pattern.accuracy * (totalAttempts - 1)) + accuracy) / totalAttempts);
    pattern.averageTime = Math.round(((pattern.averageTime * (totalAttempts - 1)) + timeSpent) / totalAttempts);
    pattern.attempts = totalAttempts + 1;
    
    // Move between strong/weak areas based on performance
    if (pattern.accuracy >= 80 && this.performancePatterns.weakAreas.includes(pattern)) {
      this.performancePatterns.weakAreas.pull(pattern);
      this.performancePatterns.strongAreas.push(pattern);
    } else if (pattern.accuracy < 60 && this.performancePatterns.strongAreas.includes(pattern)) {
      this.performancePatterns.strongAreas.pull(pattern);
      this.performancePatterns.weakAreas.push(pattern);
    }
  } else {
    // Create new pattern
    const newPattern = {
      category,
      subcategory,
      accuracy,
      averageTime: timeSpent,
      attempts: 1
    };
    
    if (accuracy >= 80) {
      this.performancePatterns.strongAreas.push(newPattern);
    } else {
      this.performancePatterns.weakAreas.push(newPattern);
    }
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

mongoAdaptiveDataSchema.methods.addAdjustment = function(sessionId, type, fromValue, toValue, reason) {
  this.adjustmentHistory.push({
    sessionId,
    adjustmentType: type,
    fromValue,
    toValue,
    reason,
    timestamp: new Date()
  });
  
  this.lastUpdated = new Date();
  return this.save();
};

mongoAdaptiveDataSchema.methods.updatePredictions = function() {
  // Simple prediction based on recent performance
  const recentSessions = 5; // Consider last 5 sessions
  const strongAreas = this.performancePatterns.strongAreas;
  const weakAreas = this.performancePatterns.weakAreas;
  
  if (strongAreas.length + weakAreas.length === 0) {
    this.predictions.nextSessionPerformance = {
      expectedAccuracy: 50,
      expectedTime: 30,
      confidence: 0.1,
      lastUpdated: new Date()
    };
    return this.save();
  }
  
  const totalAccuracy = [...strongAreas, ...weakAreas].reduce((sum, area) => sum + area.accuracy, 0);
  const totalTime = [...strongAreas, ...weakAreas].reduce((sum, area) => sum + area.averageTime, 0);
  const totalAreas = strongAreas.length + weakAreas.length;
  
  this.predictions.nextSessionPerformance = {
    expectedAccuracy: Math.round(totalAccuracy / totalAreas),
    expectedTime: Math.round(totalTime / totalAreas),
    confidence: Math.min(totalAreas / 10, 1), // Higher confidence with more data
    lastUpdated: new Date()
  };
  
  // Promotion readiness
  const avgAccuracy = totalAccuracy / totalAreas;
  const avgTime = totalTime / totalAreas;
  
  this.predictions.promotionReadiness = {
    probability: (avgAccuracy >= 85 && avgTime <= 6) ? 0.8 : 0.3,
    estimatedSessions: avgAccuracy >= 85 ? 2 : 5,
    confidence: this.predictions.nextSessionPerformance.confidence,
    lastUpdated: new Date()
  };
  
  this.lastUpdated = new Date();
  return this.save();
};

// Static methods
mongoAdaptiveDataSchema.statics.getStudentData = function(studentId, curriculum) {
  return this.findOne({ studentId, curriculum });
};

mongoAdaptiveDataSchema.statics.createInitialData = function(studentId, studentCode, curriculum, level) {
  return this.create({
    studentId,
    studentCode,
    curriculum,
    level,
    learningProfile: {},
    performancePatterns: {
      strongAreas: [],
      weakAreas: [],
      consistencyScore: 50,
      progressTrend: 'stable'
    },
    currentSettings: {},
    dataQuality: {
      sampleSize: 0,
      confidenceLevel: 0,
      dataCompleteness: 0
    }
  });
};

// MySQL Model (Sequelize)
const createMySQLAdaptiveDataModel = (sequelize) => {
  const AdaptiveData = sequelize.define('AdaptiveData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    curriculum: {
      type: DataTypes.ENUM('soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'),
      allowNull: false
    },
    level: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    learningProfile: {
      type: DataTypes.JSON
    },
    performancePatterns: {
      type: DataTypes.JSON
    },
    errorPatterns: {
      type: DataTypes.JSON
    },
    adjustmentHistory: {
      type: DataTypes.JSON
    },
    currentSettings: {
      type: DataTypes.JSON
    },
    motivationData: {
      type: DataTypes.JSON
    },
    predictions: {
      type: DataTypes.JSON
    },
    recommendations: {
      type: DataTypes.JSON
    },
    dataQuality: {
      type: DataTypes.JSON
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastUpdated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'adaptive_data',
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'curriculum']
      },
      {
        fields: ['studentCode', 'curriculum']
      }
    ]
  });

  return AdaptiveData;
};

// Export appropriate model based on database type
let AdaptiveDataModel;

if (dbType === 'mongodb') {
  AdaptiveDataModel = mongoose.model('AdaptiveData', mongoAdaptiveDataSchema);
} else if (dbType === 'mysql') {
  const sequelize = getConnection();
  AdaptiveDataModel = createMySQLAdaptiveDataModel(sequelize);
}

module.exports = AdaptiveDataModel;
