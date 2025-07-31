/**
 * Exercise Model for ICSHD GENIUSES
 * Stores exercise templates and patterns for generation
 */

const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const { getConnection, dbType } = require('../config/database');

// MongoDB Schema (Mongoose)
const mongoExerciseSchema = new mongoose.Schema({
  exerciseId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `EX-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    }
  },
  // Exercise Classification
  curriculum: {
    type: String,
    enum: ['soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'],
    required: true
  },
  category: {
    type: String,
    required: true // e.g., 'addition_simple', 'friends_of_5', 'friends_of_10'
  },
  subcategory: String, // e.g., 'single_digit', 'two_digits'
  level: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  ageGroup: {
    type: String,
    enum: ['under_7', '7_to_10', 'over_10', 'under_12', 'over_12'],
    required: true
  },
  // Exercise Content
  title: {
    type: String,
    required: true
  },
  description: String,
  instructions: String,
  // Pattern Definition (for generation)
  pattern: {
    type: {
      type: String,
      enum: ['arithmetic', 'pattern_recognition', 'logic_puzzle', 'visual', 'memory'],
      required: true
    },
    template: String, // Template for generating similar exercises
    variables: mongoose.Schema.Types.Mixed, // Variables for pattern generation
    constraints: mongoose.Schema.Types.Mixed, // Constraints for valid generation
    rules: [String] // Rules that apply to this pattern
  },
  // Exercise Data
  question: {
    text: String,
    format: {
      type: String,
      enum: ['text', 'visual', 'audio', 'mixed'],
      default: 'text'
    },
    components: [{
      type: {
        type: String,
        enum: ['number', 'operator', 'text', 'image', 'audio']
      },
      value: mongoose.Schema.Types.Mixed,
      position: Number,
      styling: mongoose.Schema.Types.Mixed
    }]
  },
  answer: {
    correct: mongoose.Schema.Types.Mixed,
    type: {
      type: String,
      enum: ['number', 'text', 'choice', 'boolean', 'sequence'],
      default: 'number'
    },
    format: String,
    alternatives: [mongoose.Schema.Types.Mixed], // For multiple choice
    tolerance: Number // For numerical answers
  },
  // Timing and Scoring
  timeLimit: {
    type: Number, // seconds
    default: 30
  },
  points: {
    type: Number,
    default: 10
  },
  bonusPoints: {
    type: Number,
    default: 0
  },
  // Hints and Help
  hints: [{
    level: {
      type: Number,
      min: 1,
      max: 3
    },
    text: String,
    visual: String, // URL or base64 image
    pointsDeduction: {
      type: Number,
      default: 2
    }
  }],
  explanation: {
    text: String,
    steps: [String],
    visual: String,
    video: String
  },
  // Metadata
  tags: [String],
  keywords: [String],
  prerequisites: [String], // Required skills/levels
  learningObjectives: [String],
  // Usage Statistics
  stats: {
    timesUsed: {
      type: Number,
      default: 0
    },
    averageAccuracy: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  // Status and Validation
  isActive: {
    type: Boolean,
    default: true
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validatedAt: Date,
  // Creation and Modification
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  version: {
    type: Number,
    default: 1
  },
  // Localization
  locale: {
    type: String,
    default: 'ar'
  },
  translations: [{
    language: String,
    title: String,
    description: String,
    instructions: String,
    question: mongoose.Schema.Types.Mixed,
    hints: [mongoose.Schema.Types.Mixed],
    explanation: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
mongoExerciseSchema.index({ curriculum: 1, level: 1, difficulty: 1 });
mongoExerciseSchema.index({ category: 1, subcategory: 1 });
mongoExerciseSchema.index({ ageGroup: 1, isActive: 1 });
mongoExerciseSchema.index({ tags: 1 });

// Virtual fields
mongoExerciseSchema.virtual('fullCategory').get(function() {
  return this.subcategory ? `${this.category}_${this.subcategory}` : this.category;
});

mongoExerciseSchema.virtual('difficultyScore').get(function() {
  const scores = { easy: 1, medium: 2, hard: 3 };
  return scores[this.difficulty] || 1;
});

// Instance methods
mongoExerciseSchema.methods.updateStats = function(isCorrect, timeSpent) {
  this.stats.timesUsed++;
  
  // Update average accuracy
  const currentAccuracy = this.stats.averageAccuracy || 0;
  const totalAttempts = this.stats.timesUsed;
  const correctAttempts = Math.round(currentAccuracy * (totalAttempts - 1) / 100) + (isCorrect ? 1 : 0);
  this.stats.averageAccuracy = Math.round((correctAttempts / totalAttempts) * 100);
  
  // Update average time
  const currentAvgTime = this.stats.averageTime || 0;
  this.stats.averageTime = Math.round(((currentAvgTime * (totalAttempts - 1)) + timeSpent) / totalAttempts);
  
  this.stats.lastUsed = new Date();
  return this.save();
};

mongoExerciseSchema.methods.validate = function(validatedBy) {
  this.isValidated = true;
  this.validatedBy = validatedBy;
  this.validatedAt = new Date();
  return this.save();
};

mongoExerciseSchema.methods.createVariation = function(modifications = {}) {
  const variation = this.toObject();
  delete variation._id;
  delete variation.exerciseId;
  delete variation.createdAt;
  delete variation.updatedAt;
  
  // Apply modifications
  Object.assign(variation, modifications);
  variation.version = this.version + 1;
  
  return new this.constructor(variation);
};

// Static methods
mongoExerciseSchema.statics.findByFilters = function(filters) {
  const query = { isActive: true };
  
  if (filters.curriculum) query.curriculum = filters.curriculum;
  if (filters.level) query.level = filters.level;
  if (filters.difficulty) query.difficulty = filters.difficulty;
  if (filters.ageGroup) query.ageGroup = filters.ageGroup;
  if (filters.category) query.category = filters.category;
  if (filters.tags) query.tags = { $in: filters.tags };
  
  return this.find(query);
};

mongoExerciseSchema.statics.getRandomExercises = function(filters, count = 10) {
  return this.aggregate([
    { $match: { ...filters, isActive: true } },
    { $sample: { size: count } }
  ]);
};

mongoExerciseSchema.statics.findSimilar = function(exerciseId, limit = 5) {
  return this.findById(exerciseId).then(exercise => {
    if (!exercise) return [];
    
    return this.find({
      _id: { $ne: exerciseId },
      curriculum: exercise.curriculum,
      category: exercise.category,
      difficulty: exercise.difficulty,
      isActive: true
    }).limit(limit);
  });
};

// MySQL Model (Sequelize)
const createMySQLExerciseModel = (sequelize) => {
  const Exercise = sequelize.define('Exercise', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    exerciseId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true
    },
    curriculum: {
      type: DataTypes.ENUM('soroban', 'vedic', 'logic', 'iq_games', 'multiplication', 'division'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    subcategory: DataTypes.STRING(50),
    level: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      allowNull: false
    },
    ageGroup: {
      type: DataTypes.ENUM('under_7', '7_to_10', 'over_10', 'under_12', 'over_12'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: DataTypes.TEXT,
    instructions: DataTypes.TEXT,
    pattern: {
      type: DataTypes.JSON
    },
    question: {
      type: DataTypes.JSON
    },
    answer: {
      type: DataTypes.JSON
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 30
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 10
    },
    bonusPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    hints: {
      type: DataTypes.JSON
    },
    explanation: {
      type: DataTypes.JSON
    },
    tags: {
      type: DataTypes.JSON
    },
    keywords: {
      type: DataTypes.JSON
    },
    prerequisites: {
      type: DataTypes.JSON
    },
    learningObjectives: {
      type: DataTypes.JSON
    },
    stats: {
      type: DataTypes.JSON
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isValidated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    validatedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    validatedAt: DataTypes.DATE,
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    modifiedBy: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    locale: {
      type: DataTypes.STRING(5),
      defaultValue: 'ar'
    },
    translations: {
      type: DataTypes.JSON
    }
  }, {
    tableName: 'exercises',
    indexes: [
      {
        fields: ['curriculum', 'level', 'difficulty']
      },
      {
        fields: ['category', 'subcategory']
      },
      {
        fields: ['ageGroup', 'isActive']
      }
    ]
  });

  return Exercise;
};

// Export appropriate model based on database type
let ExerciseModel;

if (dbType === 'mongodb') {
  ExerciseModel = mongoose.model('Exercise', mongoExerciseSchema);
} else if (dbType === 'mysql') {
  const sequelize = getConnection();
  ExerciseModel = createMySQLExerciseModel(sequelize);
}

module.exports = ExerciseModel;
