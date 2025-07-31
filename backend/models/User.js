/**
 * User Model for ICSHD GENIUSES
 * Supports both MongoDB (Mongoose) and MySQL (Sequelize)
 */

const mongoose = require('mongoose');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getConnection, dbType } = require('../config/database');

// MongoDB Schema (Mongoose)
const mongoUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'trainer', 'student'],
    default: 'student'
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: Date,
    phone: String,
    avatar: String,
    bio: String
  },
  // Student-specific fields
  studentCode: {
    type: String,
    unique: true,
    sparse: true // Allows null values to be unique
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ageGroup: {
    type: String,
    enum: ['under_7', '7_to_10', 'over_10', 'under_12', 'over_12']
  },
  currentLevel: {
    soroban: {
      type: String,
      default: 'A1'
    },
    vedic: {
      type: String,
      default: 'V1'
    },
    logic: {
      type: String,
      default: 'L1'
    },
    iq: {
      type: String,
      default: 'IQ1'
    }
  },
  // Trainer-specific fields
  trainerCode: {
    type: String,
    unique: true,
    sparse: true
  },
  specializations: [{
    type: String,
    enum: ['soroban', 'vedic', 'logic', 'iq_games']
  }],
  maxStudents: {
    type: Number,
    default: 50
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  // Settings
  preferences: {
    language: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  // Subscription info (for trainers)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
mongoUserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
mongoUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
mongoUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
mongoUserSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email, 
      role: this.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Method to generate student code
mongoUserSchema.methods.generateStudentCode = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `STU-${timestamp}-${random}`.toUpperCase();
};

// Method to generate trainer code
mongoUserSchema.methods.generateTrainerCode = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TRA-${timestamp}-${random}`.toUpperCase();
};

// MySQL Model (Sequelize)
const createMySQLUserModel = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'trainer', 'student'),
      defaultValue: 'student'
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    dateOfBirth: DataTypes.DATE,
    phone: DataTypes.STRING(20),
    avatar: DataTypes.TEXT,
    bio: DataTypes.TEXT,
    studentCode: {
      type: DataTypes.STRING(20),
      unique: true
    },
    trainerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    ageGroup: {
      type: DataTypes.ENUM('under_7', '7_to_10', 'over_10', 'under_12', 'over_12')
    },
    currentLevelSoroban: {
      type: DataTypes.STRING(10),
      defaultValue: 'A1'
    },
    currentLevelVedic: {
      type: DataTypes.STRING(10),
      defaultValue: 'V1'
    },
    currentLevelLogic: {
      type: DataTypes.STRING(10),
      defaultValue: 'L1'
    },
    currentLevelIq: {
      type: DataTypes.STRING(10),
      defaultValue: 'IQ1'
    },
    trainerCode: {
      type: DataTypes.STRING(20),
      unique: true
    },
    specializations: {
      type: DataTypes.JSON
    },
    maxStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: DataTypes.DATE,
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lockUntil: DataTypes.DATE,
    preferences: {
      type: DataTypes.JSON
    },
    subscription: {
      type: DataTypes.JSON
    }
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Instance methods for MySQL model
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.generateAuthToken = function() {
    return jwt.sign(
      { 
        id: this.id, 
        email: this.email, 
        role: this.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  };

  return User;
};

// Export appropriate model based on database type
let UserModel;

if (dbType === 'mongodb') {
  UserModel = mongoose.model('User', mongoUserSchema);
} else if (dbType === 'mysql') {
  const sequelize = getConnection();
  UserModel = createMySQLUserModel(sequelize);
}

module.exports = UserModel;
