/**
 * Authentication Middleware for ICSHD GENIUSES
 * Handles JWT token verification and user authorization
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Verify JWT token and authenticate user
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'رمز الدخول مطلوب'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'icshd_geniuses_secret_key');
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'الحساب غير مفعل'
      });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      studentCode: user.studentCode,
      fullName: user.fullName
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'رمز دخول غير صالح'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية رمز الدخول'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من الهوية'
    });
  }
};

/**
 * Authorize user based on roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'يجب تسجيل الدخول أولاً'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بهذا الإجراء'
      });
    }

    next();
  };
};

/**
 * Check if user owns the resource or is admin/trainer
 */
const checkOwnership = (resourceUserIdField = 'studentId') => {
  return async (req, res, next) => {
    try {
      const { role, userId } = req.user;
      
      // Admins can access everything
      if (role === 'admin') {
        return next();
      }

      // For students, check if they own the resource
      if (role === 'student') {
        const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
        
        if (resourceUserId && resourceUserId.toString() !== userId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'غير مصرح لك بالوصول لهذا المورد'
          });
        }
      }

      // For trainers, additional checks might be needed based on assigned students
      if (role === 'trainer') {
        // TODO: Implement trainer-student relationship checks
        // For now, allow trainers to access all student resources
      }

      next();

    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الصلاحيات'
      });
    }
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'icshd_geniuses_secret_key');
    
    const user = await User.findById(decoded.userId).select('-password');
    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
        fullName: user.fullName
      };
    }

    next();

  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

/**
 * Rate limiting middleware
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }

    // Check current requests
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'تم تجاوز الحد المسموح من الطلبات',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    currentRequests.push(now);
    requests.set(key, currentRequests);

    next();
  };
};

/**
 * Validate session ownership
 */
const validateSessionOwnership = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { userId, role } = req.user;

    // Admins can access all sessions
    if (role === 'admin') {
      return next();
    }

    const Session = require('../models/Session');
    const session = await Session.findOne({ sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة غير موجودة'
      });
    }

    // Students can only access their own sessions
    if (role === 'student' && session.studentId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول لهذه الجلسة'
      });
    }

    // Trainers can access sessions they created or are assigned to
    if (role === 'trainer' && session.trainerId && session.trainerId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول لهذه الجلسة'
      });
    }

    // Add session to request for use in controller
    req.session = session;
    next();

  } catch (error) {
    console.error('Session ownership validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من صلاحية الجلسة'
    });
  }
};

/**
 * Validate curriculum access
 */
const validateCurriculumAccess = (req, res, next) => {
  const { curriculum } = req.params;
  const validCurricula = ['soroban', 'vedic', 'logic', 'iqgames'];

  if (!validCurricula.includes(curriculum)) {
    return res.status(400).json({
      success: false,
      message: 'منهج غير صالح'
    });
  }

  next();
};

/**
 * Log user activity
 */
const logActivity = (action) => {
  return (req, res, next) => {
    // Store activity info for logging after response
    req.activityLog = {
      action,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    };

    // Log after response is sent
    const originalSend = res.send;
    res.send = function(data) {
      // Log the activity
      console.log('User Activity:', {
        ...req.activityLog,
        statusCode: res.statusCode,
        success: res.statusCode < 400
      });

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Validate request body
 */
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صالحة',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    next();
  };
};

/**
 * CORS middleware for specific origins
 */
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.WORDPRESS_URL,
    'http://localhost:3000',
    'http://localhost:3001'
  ].filter(Boolean);

  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      message: 'بيانات غير صالحة',
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} موجود بالفعل`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'رمز دخول غير صالح'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية رمز الدخول'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'خطأ في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Not found middleware
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
};

module.exports = {
  authenticate,
  authorize,
  checkOwnership,
  optionalAuth,
  createRateLimit,
  validateSessionOwnership,
  validateCurriculumAccess,
  logActivity,
  validateBody,
  corsMiddleware,
  errorHandler,
  notFound
};
