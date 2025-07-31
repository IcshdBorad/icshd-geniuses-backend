/**
 * Adaptive Learning Routes for ICSHD GENIUSES
 * Routes for adaptive session management and personalization
 */

const express = require('express');
const router = express.Router();
const AdaptiveSessionController = require('../controllers/AdaptiveSessionController');
const { authenticateToken, authorizeRoles, validateRequest } = require('../middleware/auth');
const { body, param, query } = require('express-validator');

// Initialize controller (will be injected with Socket.io instance)
let adaptiveController;

const initializeAdaptiveRoutes = (io) => {
  adaptiveController = new AdaptiveSessionController(io);
  return router;
};

// Validation schemas
const createSessionValidation = [
  body('curriculum').isIn(['soroban', 'vedic', 'logic', 'iqgames']).withMessage('Invalid curriculum'),
  body('requestedLevel').isInt({ min: 1, max: 10 }).withMessage('Level must be between 1 and 10'),
  body('duration').optional().isInt({ min: 5, max: 120 }).withMessage('Duration must be between 5 and 120 minutes'),
  body('questionCount').optional().isInt({ min: 5, max: 50 }).withMessage('Question count must be between 5 and 50'),
  body('preferences').optional().isObject()
];

const submitAnswerValidation = [
  param('sessionId').isMongoId().withMessage('Invalid session ID'),
  param('exerciseIndex').isInt({ min: 0 }).withMessage('Invalid exercise index'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('timeSpent').isInt({ min: 0 }).withMessage('Time spent must be a positive integer'),
  body('skipped').optional().isBoolean()
];

const studentIdValidation = [
  param('studentId').isMongoId().withMessage('Invalid student ID')
];

const sessionIdValidation = [
  param('sessionId').isMongoId().withMessage('Invalid session ID')
];

// Routes

/**
 * @route POST /api/adaptive/sessions/:studentId
 * @desc Create personalized adaptive session
 * @access Student, Trainer, Admin
 */
router.post('/sessions/:studentId',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  studentIdValidation,
  createSessionValidation,
  validateRequest,
  async (req, res) => {
    try {
      await adaptiveController.createAdaptiveSession(req, res);
    } catch (error) {
      console.error('Route error - create adaptive session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/adaptive/sessions/:sessionId/exercises/:exerciseIndex/submit
 * @desc Submit answer with real-time adaptation
 * @access Student, Trainer, Admin
 */
router.post('/sessions/:sessionId/exercises/:exerciseIndex/submit',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  submitAnswerValidation,
  validateRequest,
  async (req, res) => {
    try {
      await adaptiveController.submitAnswerWithAdaptation(req, res);
    } catch (error) {
      console.error('Route error - submit answer with adaptation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/adaptive/sessions/:sessionId/recommendations/:exerciseIndex
 * @desc Get adaptive recommendations for current exercise
 * @access Student, Trainer, Admin
 */
router.get('/sessions/:sessionId/recommendations/:exerciseIndex',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    param('exerciseIndex').isInt({ min: 0 }).withMessage('Invalid exercise index')
  ],
  validateRequest,
  async (req, res) => {
    try {
      await adaptiveController.getAdaptiveRecommendations(req, res);
    } catch (error) {
      console.error('Route error - get recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/adaptive/sessions/:sessionId/complete
 * @desc Complete adaptive session with analysis
 * @access Student, Trainer, Admin
 */
router.post('/sessions/:sessionId/complete',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  sessionIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      await adaptiveController.completeAdaptiveSession(req, res);
    } catch (error) {
      console.error('Route error - complete adaptive session:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/adaptive/analytics/:studentId
 * @desc Get adaptive session analytics for student
 * @access Student (own data), Trainer, Admin
 */
router.get('/analytics/:studentId',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    query('timeRange').optional().isIn(['week', 'month', 'quarter', 'year']).withMessage('Invalid time range'),
    query('curriculum').optional().isIn(['soroban', 'vedic', 'logic', 'iqgames']).withMessage('Invalid curriculum')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if student is accessing their own data
      if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      
      await adaptiveController.getSessionAnalytics(req, res);
    } catch (error) {
      console.error('Route error - get analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/adaptive/sessions/:sessionId/force-adaptation
 * @desc Force adaptation during session (for testing/manual adjustment)
 * @access Trainer, Admin
 */
router.post('/sessions/:sessionId/force-adaptation',
  authenticateToken,
  authorizeRoles(['trainer', 'admin']),
  [
    param('sessionId').isMongoId().withMessage('Invalid session ID'),
    body('adaptationType').isIn(['difficulty', 'time', 'focus']).withMessage('Invalid adaptation type'),
    body('parameters').isObject().withMessage('Parameters must be an object')
  ],
  validateRequest,
  async (req, res) => {
    try {
      await adaptiveController.forceAdaptation(req, res);
    } catch (error) {
      console.error('Route error - force adaptation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/adaptive/students/:studentId/profile
 * @desc Get student's adaptive learning profile
 * @access Student (own data), Trainer, Admin
 */
router.get('/students/:studentId/profile',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  studentIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      // Check if student is accessing their own data
      if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const AdaptiveLearningEngine = require('../adaptive/AdaptiveLearningEngine');
      const adaptiveEngine = new AdaptiveLearningEngine();
      
      const { curriculum = 'soroban' } = req.query;
      const adaptiveData = await adaptiveEngine.getAdaptiveData(req.params.studentId, curriculum);
      
      res.json({
        success: true,
        data: {
          studentId: req.params.studentId,
          curriculum,
          profile: {
            currentLevel: adaptiveData.currentLevel,
            difficultyScore: adaptiveData.difficultyScore,
            learningStyle: adaptiveData.learningStyle,
            strengthAreas: adaptiveData.strengthAreas,
            weaknessAreas: adaptiveData.weaknessAreas,
            averageAccuracy: adaptiveData.averageAccuracy,
            averageSpeed: adaptiveData.averageSpeed,
            lastUpdated: adaptiveData.lastUpdated
          },
          recentPerformance: adaptiveData.performanceHistory?.slice(-5) || []
        }
      });
    } catch (error) {
      console.error('Route error - get student profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/adaptive/students/:studentId/recommendations
 * @desc Get personalized learning recommendations
 * @access Student (own data), Trainer, Admin
 */
router.get('/students/:studentId/recommendations',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    query('curriculum').optional().isIn(['soroban', 'vedic', 'logic', 'iqgames']).withMessage('Invalid curriculum')
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if student is accessing their own data
      if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const AdaptiveLearningEngine = require('../adaptive/AdaptiveLearningEngine');
      const adaptiveEngine = new AdaptiveLearningEngine();
      
      const { curriculum = 'soroban' } = req.query;
      const adaptiveData = await adaptiveEngine.getAdaptiveData(req.params.studentId, curriculum);
      
      // Generate recommendations based on current profile
      const recommendations = adaptiveEngine.generateRecommendations(adaptiveData, {
        accuracy: adaptiveData.averageAccuracy || 0,
        averageTime: adaptiveData.averageSpeed || 0,
        consistency: adaptiveData.averageConsistency || 0
      });
      
      res.json({
        success: true,
        data: {
          studentId: req.params.studentId,
          curriculum,
          recommendations,
          adaptiveInsights: {
            currentDifficultyLevel: Math.round(adaptiveData.difficultyScore * 100),
            suggestedNextLevel: adaptiveData.currentLevel + (adaptiveData.difficultyScore > 0.8 ? 1 : 0),
            focusAreas: adaptiveData.weaknessAreas?.slice(0, 2) || [],
            strengthAreas: adaptiveData.strengthAreas?.slice(0, 2) || []
          }
        }
      });
    } catch (error) {
      console.error('Route error - get recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route POST /api/adaptive/students/:studentId/preferences
 * @desc Update student's learning preferences
 * @access Student (own data), Trainer, Admin
 */
router.post('/students/:studentId/preferences',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  [
    param('studentId').isMongoId().withMessage('Invalid student ID'),
    body('learningStyle').optional().isIn(['visual', 'auditory', 'kinesthetic', 'mixed']).withMessage('Invalid learning style'),
    body('preferredDifficulty').optional().isFloat({ min: 0.1, max: 1.0 }).withMessage('Preferred difficulty must be between 0.1 and 1.0'),
    body('timePreferences').optional().isObject(),
    body('focusAreas').optional().isArray()
  ],
  validateRequest,
  async (req, res) => {
    try {
      // Check if student is updating their own data
      if (req.user.role === 'student' && req.user.id !== req.params.studentId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const AdaptiveData = require('../models/AdaptiveData');
      const { curriculum = 'soroban' } = req.query;
      
      // Update adaptive data with preferences
      const updateData = {};
      if (req.body.learningStyle) updateData.learningStyle = req.body.learningStyle;
      if (req.body.preferredDifficulty) updateData.preferredDifficulty = req.body.preferredDifficulty;
      if (req.body.timePreferences) updateData.timePreferences = req.body.timePreferences;
      if (req.body.focusAreas) updateData.preferredExerciseTypes = req.body.focusAreas;
      
      updateData.lastUpdated = new Date();
      
      const adaptiveData = await AdaptiveData.findOneAndUpdate(
        { studentId: req.params.studentId, curriculum },
        { $set: updateData },
        { new: true, upsert: true }
      );
      
      res.json({
        success: true,
        data: {
          message: 'Preferences updated successfully',
          updatedPreferences: updateData,
          adaptiveData
        }
      });
    } catch (error) {
      console.error('Route error - update preferences:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

/**
 * @route GET /api/adaptive/sessions/:sessionId/real-time-data
 * @desc Get real-time session data for monitoring
 * @access Student (own session), Trainer, Admin
 */
router.get('/sessions/:sessionId/real-time-data',
  authenticateToken,
  authorizeRoles(['student', 'trainer', 'admin']),
  sessionIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const Session = require('../models/Session');
      const session = await Session.findById(req.params.sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Check if student is accessing their own session
      if (req.user.role === 'student' && req.user.id !== session.student.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get active session data if available
      const activeSession = adaptiveController.activeSessions.get(req.params.sessionId);
      
      const realTimeData = {
        sessionId: req.params.sessionId,
        status: session.status,
        currentExercise: activeSession?.currentExerciseIndex || 0,
        totalExercises: session.exercises.length,
        recentResponses: activeSession?.recentResponses || [],
        adaptationCount: activeSession?.adaptationCount || 0,
        sessionStartTime: activeSession?.startTime || session.createdAt,
        currentMetrics: activeSession ? 
          adaptiveController.calculateSessionMetrics(session.exercises.slice(0, activeSession.currentExerciseIndex + 1)) :
          null
      };
      
      res.json({
        success: true,
        data: realTimeData
      });
    } catch (error) {
      console.error('Route error - get real-time data:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
);

module.exports = { router, initializeAdaptiveRoutes };
