/**
 * Session Model for ICSHD GENIUSES
 * Tracks training sessions and performance data
 */

const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const { getConnection, dbType } = require('../config/database');

// MongoDB Schema (Mongoose)
const mongoSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
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
  // Session Configuration
  curriculum: {
    type: String,
    enum: ['soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'],
    required: true
  },
  level: {
    type: String,
    required: true
  },
  ageGroup: {
    type: String,
    enum: ['under_7', '7_to_10', 'over_10', 'under_12', 'over_12'],
    required: true
  },
  exerciseType: {
    type: String,
    required: true
  },
  // Session Settings
  totalQuestions: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  timeLimit: {
    type: Number, // in seconds
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'adaptive'],
    default: 'medium'
  },
  // Session Timing
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number // in seconds
  },
  // Performance Metrics
  correctAnswers: {
    type: Number,
    default: 0,
    min: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0,
    min: 0
  },
  skippedQuestions: {
    type: Number,
    default: 0,
    min: 0
  },
  accuracy: {
    type: Number, // percentage
    min: 0,
    max: 100
  },
  averageTimePerQuestion: {
    type: Number // in seconds
  },
  totalScore: {
    type: Number,
    default: 0
  },
  // Session Result
  result: {
    type: String,
    enum: ['excellent', 'good', 'needs_improvement', 'incomplete'],
    required: true
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  promotionEligible: {
    type: Boolean,
    default: false
  },
  // Detailed Exercise Data
  exercises: [{
    questionNumber: {
      type: Number,
      required: true
    },
    question: {
      type: String,
      required: true
    },
    correctAnswer: {
      type: String,
      required: true
    },
    studentAnswer: {
      type: String
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    timeSpent: {
      type: Number // in seconds
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    exerciseType: String,
    hints: [{
      hintText: String,
      usedAt: Date
    }]
  }],
  // Adaptive Learning Data
  adaptiveData: {
    initialDifficulty: String,
    finalDifficulty: String,
    adjustments: [{
      questionNumber: Number,
      oldDifficulty: String,
      newDifficulty: String,
      reason: String,
      timestamp: Date
    }],
    weakAreas: [String],
    strongAreas: [String]
  },
  // Session Notes and Feedback
  trainerNotes: String,
  systemFeedback: String,
  studentFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String
  },
  // Technical Data
  deviceInfo: {
    userAgent: String,
    platform: String,
    screenResolution: String,
    connectionType: String
  },
  sessionConfig: {
    adaptiveEnabled: {
      type: Boolean,
      default: false
    },
    hintsEnabled: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    customSettings: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields
mongoSessionSchema.virtual('completionRate').get(function() {
  if (this.totalQuestions === 0) return 0;
  return Math.round(((this.correctAnswers + this.incorrectAnswers) / this.totalQuestions) * 100);
});

mongoSessionSchema.virtual('questionsAttempted').get(function() {
  return this.correctAnswers + this.incorrectAnswers;
});

mongoSessionSchema.virtual('successRate').get(function() {
  const attempted = this.questionsAttempted;
  if (attempted === 0) return 0;
  return Math.round((this.correctAnswers / attempted) * 100);
});

// Pre-save middleware
mongoSessionSchema.pre('save', function(next) {
  // Calculate accuracy
  const attempted = this.correctAnswers + this.incorrectAnswers;
  if (attempted > 0) {
    this.accuracy = Math.round((this.correctAnswers / attempted) * 100);
  }

  // Calculate duration if endTime is set
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / 1000);
  }

  // Calculate average time per question
  if (this.duration && attempted > 0) {
    this.averageTimePerQuestion = Math.round(this.duration / attempted);
  }

  // Determine if session is passed
  this.isPassed = this.accuracy >= 70 && this.completionRate >= 80;

  // Check promotion eligibility
  this.promotionEligible = this.accuracy >= 85 && this.averageTimePerQuestion <= 6;

  next();
});

// Instance methods
mongoSessionSchema.methods.addExercise = function(exerciseData) {
  this.exercises.push(exerciseData);
  
  // Update counters
  if (exerciseData.isCorrect) {
    this.correctAnswers++;
  } else if (exerciseData.studentAnswer) {
    this.incorrectAnswers++;
  } else {
    this.skippedQuestions++;
  }
};

mongoSessionSchema.methods.completeSession = function() {
  this.endTime = new Date();
  
  // Determine result based on performance
  if (this.accuracy >= 90) {
    this.result = 'excellent';
  } else if (this.accuracy >= 75) {
    this.result = 'good';
  } else if (this.accuracy >= 50) {
    this.result = 'needs_improvement';
  } else {
    this.result = 'incomplete';
  }
};

// MySQL Model (Sequelize)
const createMySQLSessionModel = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    sessionId: {
      type: DataTypes.STRING(50),
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
    level: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    ageGroup: {
      type: DataTypes.ENUM('under_7', '7_to_10', 'over_10', 'under_12', 'over_12'),
      allowNull: false
    },
    exerciseType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    totalQuestions: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard', 'adaptive'),
      defaultValue: 'medium'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: DataTypes.DATE,
    duration: DataTypes.INTEGER,
    correctAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    incorrectAnswers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    skippedQuestions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    accuracy: DataTypes.DECIMAL(5, 2),
    averageTimePerQuestion: DataTypes.DECIMAL(8, 2),
    totalScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    result: {
      type: DataTypes.ENUM('excellent', 'good', 'needs_improvement', 'incomplete'),
      allowNull: false
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    promotionEligible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    exercises: {
      type: DataTypes.JSON
    },
    adaptiveData: {
      type: DataTypes.JSON
    },
    trainerNotes: DataTypes.TEXT,
    systemFeedback: DataTypes.TEXT,
    studentFeedback: {
      type: DataTypes.JSON
    },
    deviceInfo: {
      type: DataTypes.JSON
    },
    sessionConfig: {
      type: DataTypes.JSON
    }
  }, {
    tableName: 'sessions',
    hooks: {
      beforeSave: (session) => {
        // Calculate accuracy
        const attempted = session.correctAnswers + session.incorrectAnswers;
        if (attempted > 0) {
          session.accuracy = Math.round((session.correctAnswers / attempted) * 100);
        }

        // Calculate duration
        if (session.endTime && session.startTime) {
          session.duration = Math.round((new Date(session.endTime) - new Date(session.startTime)) / 1000);
        }

        // Calculate average time per question
        if (session.duration && attempted > 0) {
          session.averageTimePerQuestion = Math.round(session.duration / attempted);
        }

        // Determine pass status
        session.isPassed = session.accuracy >= 70;
        session.promotionEligible = session.accuracy >= 85 && session.averageTimePerQuestion <= 6;
      }
    }
  });

  return Session;
};

// Export appropriate model based on database type
let SessionModel;

if (dbType === 'mongodb') {
  SessionModel = mongoose.model('Session', mongoSessionSchema);
} else if (dbType === 'mysql') {
  const sequelize = getConnection();
  SessionModel = createMySQLSessionModel(sequelize);
}

module.exports = SessionModel;
