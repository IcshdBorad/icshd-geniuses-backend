const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // لتشفير كلمات المرور
const jwt = require('jsonwebtoken'); // لإنشاء رموز JWT

/**
 * User Model for ICSHD GENIUSES
 * يدعم فقط MongoDB (Mongoose) في هذا الإصدار لتجنب التعقيد.
 */

// MongoDB Schema (Mongoose)
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please add a username'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false // لا يتم إرجاع كلمة المرور في الاستعلامات افتراضيًا
    },
    role: {
        type: String,
        enum: ['admin', 'trainer', 'student'],
        default: 'student'
    },
    profile: {
        firstName: {
            type: String,
            required: [true, 'Please add a first name'],
            trim: true
        },
        lastName: {
            type: String,
            required: [true, 'Please add a last name'],
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
    timestamps: true, // يضيف createdAt و updatedAt تلقائيًا
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
    return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    // تشفير كلمة المرور فقط إذا تم تعديلها أو عند إنشاء مستخدم جديد
    if (!this.isModified('password')) return next();
        
    try {
        const salt = await bcrypt.genSalt(10); // استخدم 10 أو 12 لتشفير أقوى وأداء جيد
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // تمرير الخطأ إلى middleware التالي
    }
});

// Method to compare password (matchPassword بدلاً من comparePassword لتوحيد التسمية)
UserSchema.methods.matchPassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token (getSignedJwtToken بدلاً من generateAuthToken لتوحيد التسمية)
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { 
            id: this._id, 
            email: this.email, 
            role: this.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' } // JWT_EXPIRE بدلاً من JWT_EXPIRES_IN لتوحيد التسمية
    );
};

// Method to generate student code
UserSchema.methods.generateStudentCode = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `STU-${timestamp}-${random}`.toUpperCase();
};

// Method to generate trainer code
UserSchema.methods.generateTrainerCode = function() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `TRA-${timestamp}-${random}`.toUpperCase();
};

// تصدير نموذج المستخدم
module.exports = mongoose.model('User', UserSchema);