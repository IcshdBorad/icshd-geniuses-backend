/**
 * Session Routes for ICSHD GENIUSES
 * Handles training session endpoints
 */

const express = require('express');
const router = express.Router();
const { 
  authenticate, 
  authorize, 
  validateSessionOwnership, 
  validateCurriculumAccess,
  createRateLimit, 
  logActivity 
} = require('../middleware/auth');

// Rate limiting
const sessionRateLimit = createRateLimit(15 * 60 * 1000, 50); // 50 requests per 15 minutes

// SessionManager will be injected by the main app
let sessionManager;

// Middleware to inject SessionManager
const injectSessionManager = (req, res, next) => {
  req.sessionManager = sessionManager;
  next();
};

// Set SessionManager instance
const setSessionManager = (manager) => {
  sessionManager = manager;
};

/**
 * @route   POST /api/sessions/create
 * @desc    Create new training session
 * @access  Private (Student, Trainer, Admin)
 */
router.post('/create', 
  authenticate, 
  sessionRateLimit, 
  logActivity('session_create'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { 
        curriculum, 
        level, 
        ageGroup, 
        sessionType = 'practice',
        customSettings = {},
        duration 
      } = req.body;

      // Validate required fields
      if (!curriculum || !level) {
        return res.status(400).json({
          success: false,
          message: 'المنهج والمستوى مطلوبان'
        });
      }

      // For students, use their own ID. For trainers/admins, allow specifying student
      let studentId = req.user.userId;
      let trainerId = null;

      if (req.user.role === 'trainer' || req.user.role === 'admin') {
        studentId = req.body.studentId || req.user.userId;
        trainerId = req.user.userId;
      }

      const sessionConfig = {
        studentId,
        trainerId,
        curriculum,
        level,
        ageGroup: ageGroup || req.user.ageGroup,
        sessionType,
        customSettings,
        duration
      };

      const result = await req.sessionManager.createSession(sessionConfig);

      res.status(201).json({
        success: true,
        message: 'تم إنشاء الجلسة بنجاح',
        ...result
      });

    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء الجلسة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sessions/:sessionId/current-exercise
 * @desc    Get current exercise for session
 * @access  Private (Session Owner)
 */
router.get('/:sessionId/current-exercise',
  authenticate,
  validateSessionOwnership,
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const result = await req.sessionManager.getCurrentExercise(sessionId);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Get current exercise error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب التمرين الحالي',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sessions/:sessionId/submit-answer
 * @desc    Submit answer for current exercise
 * @access  Private (Session Owner)
 */
router.post('/:sessionId/submit-answer',
  authenticate,
  validateSessionOwnership,
  sessionRateLimit,
  logActivity('submit_answer'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answer, timeSpent = 0 } = req.body;

      if (answer === undefined || answer === null) {
        return res.status(400).json({
          success: false,
          message: 'الإجابة مطلوبة'
        });
      }

      const result = await req.sessionManager.submitAnswer(sessionId, answer, timeSpent);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Submit answer error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إرسال الإجابة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sessions/:sessionId/skip
 * @desc    Skip current exercise
 * @access  Private (Session Owner)
 */
router.post('/:sessionId/skip',
  authenticate,
  validateSessionOwnership,
  logActivity('skip_exercise'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason = 'student_choice' } = req.body;

      const result = await req.sessionManager.skipExercise(sessionId, reason);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Skip exercise error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تخطي التمرين',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sessions/:sessionId/hint
 * @desc    Request hint for current exercise
 * @access  Private (Session Owner)
 */
router.post('/:sessionId/hint',
  authenticate,
  validateSessionOwnership,
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { hintIndex = 0 } = req.body;

      const result = await req.sessionManager.requestHint(sessionId, hintIndex);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Request hint error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في طلب التلميح',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sessions/:sessionId/pause
 * @desc    Pause session
 * @access  Private (Session Owner)
 */
router.post('/:sessionId/pause',
  authenticate,
  validateSessionOwnership,
  logActivity('pause_session'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason = 'student_request' } = req.body;

      const result = await req.sessionManager.pauseSession(sessionId, reason);

      res.json({
        success: true,
        message: 'تم إيقاف الجلسة مؤقتاً',
        ...result
      });

    } catch (error) {
      console.error('Pause session error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إيقاف الجلسة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sessions/:sessionId/resume
 * @desc    Resume paused session
 * @access  Private (Session Owner)
 */
router.post('/:sessionId/resume',
  authenticate,
  validateSessionOwnership,
  logActivity('resume_session'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await req.sessionManager.resumeSession(sessionId);

      res.json({
        success: true,
        message: 'تم استئناف الجلسة',
        ...result
      });

    } catch (error) {
      console.error('Resume session error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في استئناف الجلسة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/sessions/:sessionId/complete
 * @desc    Complete session manually
 * @access  Private (Session Owner)
 */
router.post('/:sessionId/complete',
  authenticate,
  validateSessionOwnership,
  logActivity('complete_session'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { reason = 'manual_completion' } = req.body;

      const result = await req.sessionManager.completeSession(sessionId, reason);

      res.json({
        success: true,
        message: 'تم إنهاء الجلسة',
        ...result
      });

    } catch (error) {
      console.error('Complete session error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنهاء الجلسة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sessions/:sessionId/status
 * @desc    Get session status and progress
 * @access  Private (Session Owner)
 */
router.get('/:sessionId/status',
  authenticate,
  validateSessionOwnership,
  injectSessionManager,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      const result = await req.sessionManager.getSessionStatus(sessionId);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      console.error('Get session status error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب حالة الجلسة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/sessions/active
 * @desc    Get active sessions (admin/trainer only)
 * @access  Private (Admin, Trainer)
 */
router.get('/active',
  authenticate,
  authorize('admin', 'trainer'),
  injectSessionManager,
  async (req, res) => {
    try {
      const activeSessions = req.sessionManager.getActiveSessions();

      res.json({
        success: true,
        activeSessions,
        count: activeSessions.length
      });

    } catch (error) {
      console.error('Get active sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الجلسات النشطة'
      });
    }
  }
);

/**
 * @route   POST /api/sessions/cleanup-inactive
 * @desc    Cleanup inactive sessions (admin only)
 * @access  Private (Admin)
 */
router.post('/cleanup-inactive',
  authenticate,
  authorize('admin'),
  logActivity('cleanup_sessions'),
  injectSessionManager,
  async (req, res) => {
    try {
      const { inactiveThreshold = 30 * 60 * 1000 } = req.body; // 30 minutes default

      const cleanedCount = await req.sessionManager.cleanupInactiveSessions(inactiveThreshold);

      res.json({
        success: true,
        message: `تم تنظيف ${cleanedCount} جلسة غير نشطة`,
        cleanedCount
      });

    } catch (error) {
      console.error('Cleanup inactive sessions error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تنظيف الجلسات غير النشطة'
      });
    }
  }
);

module.exports = {
  router,
  setSessionManager
};
