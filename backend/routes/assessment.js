/**
 * Assessment Routes for ICSHD GENIUSES
 * Handles performance assessment and promotion endpoints
 */

const express = require('express');
const router = express.Router();
const AssessmentEngine = require('../assessment/AssessmentEngine');
const PromotionSystem = require('../assessment/PromotionSystem');
const { 
  authenticate, 
  authorize, 
  checkOwnership,
  validateCurriculumAccess,
  createRateLimit, 
  logActivity 
} = require('../middleware/auth');

// Initialize assessment systems
const assessmentEngine = new AssessmentEngine();
const promotionSystem = new PromotionSystem();

// Rate limiting
const assessmentRateLimit = createRateLimit(15 * 60 * 1000, 30); // 30 requests per 15 minutes

/**
 * @route   GET /api/assessment/session/:sessionId
 * @desc    Get detailed session analysis
 * @access  Private (Session Owner, Trainer, Admin)
 */
router.get('/session/:sessionId',
  authenticate,
  assessmentRateLimit,
  async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Find session and check ownership
      const Session = require('../models/Session');
      const session = await Session.findById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'الجلسة غير موجودة'
        });
      }

      // Check access permissions
      const { userId, role } = req.user;
      if (role === 'student' && session.studentId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذا التحليل'
        });
      }

      if (role === 'trainer' && session.trainerId && session.trainerId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول لهذا التحليل'
        });
      }

      const analysis = await assessmentEngine.analyzeSession(sessionId);

      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      console.error('Session analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في تحليل الجلسة',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/assessment/student/:studentId/report
 * @desc    Generate comprehensive student report
 * @access  Private (Student Owner, Trainer, Admin)
 */
router.get('/student/:studentId/report',
  authenticate,
  checkOwnership('studentId'),
  assessmentRateLimit,
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { curriculum, timeRange = 30 } = req.query;

      if (!curriculum) {
        return res.status(400).json({
          success: false,
          message: 'المنهج مطلوب'
        });
      }

      const report = await assessmentEngine.generateStudentReport(
        studentId,
        curriculum,
        parseInt(timeRange)
      );

      res.json({
        success: true,
        report
      });

    } catch (error) {
      console.error('Student report error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء تقرير الطالب',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/assessment/promotion/check/:studentId/:curriculum
 * @desc    Check promotion eligibility
 * @access  Private (Student Owner, Trainer, Admin)
 */
router.get('/promotion/check/:studentId/:curriculum',
  authenticate,
  checkOwnership('studentId'),
  validateCurriculumAccess,
  async (req, res) => {
    try {
      const { studentId, curriculum } = req.params;

      // Get student's current level
      const User = require('../models/User');
      const student = await User.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'الطالب غير موجود'
        });
      }

      const currentLevel = student.currentLevel[curriculum];
      if (!currentLevel) {
        return res.status(400).json({
          success: false,
          message: 'الطالب غير مسجل في هذا المنهج'
        });
      }

      const eligibilityResult = await promotionSystem.checkPromotionEligibility(
        studentId,
        curriculum,
        currentLevel
      );

      res.json({
        success: true,
        eligibility: eligibilityResult
      });

    } catch (error) {
      console.error('Promotion check error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في فحص أهلية الترقية',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/assessment/promotion/process/:studentId/:curriculum
 * @desc    Process automatic promotion
 * @access  Private (Trainer, Admin)
 */
router.post('/promotion/process/:studentId/:curriculum',
  authenticate,
  authorize('trainer', 'admin'),
  validateCurriculumAccess,
  logActivity('process_promotion'),
  async (req, res) => {
    try {
      const { studentId, curriculum } = req.params;

      // Get student's current level
      const User = require('../models/User');
      const student = await User.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'الطالب غير موجود'
        });
      }

      const currentLevel = student.currentLevel[curriculum];
      if (!currentLevel) {
        return res.status(400).json({
          success: false,
          message: 'الطالب غير مسجل في هذا المنهج'
        });
      }

      // Check eligibility first
      const eligibilityResult = await promotionSystem.checkPromotionEligibility(
        studentId,
        curriculum,
        currentLevel
      );

      if (!eligibilityResult.eligible) {
        return res.status(400).json({
          success: false,
          message: 'الطالب غير مؤهل للترقية حالياً',
          eligibility: eligibilityResult
        });
      }

      // Process promotion
      const promotionResult = await promotionSystem.processAutomaticPromotion(
        studentId,
        curriculum,
        eligibilityResult
      );

      res.json({
        success: true,
        message: 'تم معالجة الترقية بنجاح',
        promotion: promotionResult
      });

    } catch (error) {
      console.error('Process promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في معالجة الترقية',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/assessment/promotion/pending
 * @desc    Get pending promotions for review
 * @access  Private (Trainer, Admin)
 */
router.get('/promotion/pending',
  authenticate,
  authorize('trainer', 'admin'),
  async (req, res) => {
    try {
      const { curriculum } = req.query;
      const trainerId = req.user.role === 'trainer' ? req.user.userId : null;

      const pendingPromotions = await promotionSystem.getPendingPromotions(trainerId, curriculum);

      res.json({
        success: true,
        promotions: pendingPromotions,
        count: pendingPromotions.length
      });

    } catch (error) {
      console.error('Get pending promotions error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الترقيات المعلقة'
      });
    }
  }
);

/**
 * @route   POST /api/assessment/promotion/:promotionId/approve
 * @desc    Approve promotion request
 * @access  Private (Trainer, Admin)
 */
router.post('/promotion/:promotionId/approve',
  authenticate,
  authorize('trainer', 'admin'),
  logActivity('approve_promotion'),
  async (req, res) => {
    try {
      const { promotionId } = req.params;
      const { notes = '' } = req.body;
      const trainerId = req.user.userId;

      const result = await promotionSystem.approvePromotion(promotionId, trainerId, notes);

      res.json({
        success: true,
        message: 'تم اعتماد الترقية بنجاح',
        promotion: result.promotion
      });

    } catch (error) {
      console.error('Approve promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في اعتماد الترقية',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   POST /api/assessment/promotion/:promotionId/reject
 * @desc    Reject promotion request
 * @access  Private (Trainer, Admin)
 */
router.post('/promotion/:promotionId/reject',
  authenticate,
  authorize('trainer', 'admin'),
  logActivity('reject_promotion'),
  async (req, res) => {
    try {
      const { promotionId } = req.params;
      const { reason } = req.body;
      const trainerId = req.user.userId;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'سبب الرفض مطلوب'
        });
      }

      const result = await promotionSystem.rejectPromotion(promotionId, trainerId, reason);

      res.json({
        success: true,
        message: 'تم رفض الترقية',
        promotion: result.promotion
      });

    } catch (error) {
      console.error('Reject promotion error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في رفض الترقية',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @route   GET /api/assessment/promotion/history/:studentId
 * @desc    Get promotion history for student
 * @access  Private (Student Owner, Trainer, Admin)
 */
router.get('/promotion/history/:studentId',
  authenticate,
  checkOwnership('studentId'),
  async (req, res) => {
    try {
      const { studentId } = req.params;
      const { curriculum } = req.query;

      const history = await promotionSystem.getPromotionHistory(studentId, curriculum);

      res.json({
        success: true,
        history,
        count: history.length
      });

    } catch (error) {
      console.error('Get promotion history error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب تاريخ الترقيات'
      });
    }
  }
);

/**
 * @route   GET /api/assessment/promotion/statistics
 * @desc    Get promotion statistics
 * @access  Private (Trainer, Admin)
 */
router.get('/promotion/statistics',
  authenticate,
  authorize('trainer', 'admin'),
  async (req, res) => {
    try {
      const { timeRange = 30, curriculum } = req.query;

      const statistics = await promotionSystem.getPromotionStatistics(
        parseInt(timeRange),
        curriculum
      );

      res.json({
        success: true,
        statistics
      });

    } catch (error) {
      console.error('Get promotion statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات الترقيات'
      });
    }
  }
);

/**
 * @route   GET /api/assessment/adaptive/:studentId/:curriculum
 * @desc    Get adaptive learning data
 * @access  Private (Student Owner, Trainer, Admin)
 */
router.get('/adaptive/:studentId/:curriculum',
  authenticate,
  checkOwnership('studentId'),
  validateCurriculumAccess,
  async (req, res) => {
    try {
      const { studentId, curriculum } = req.params;

      const AdaptiveData = require('../models/AdaptiveData');
      const adaptiveData = await AdaptiveData.findOne({ studentId, curriculum });

      if (!adaptiveData) {
        return res.status(404).json({
          success: false,
          message: 'لا توجد بيانات تكيفية لهذا الطالب في هذا المنهج'
        });
      }

      res.json({
        success: true,
        adaptiveData: {
          currentLevel: adaptiveData.currentLevel,
          strengths: adaptiveData.strengths,
          weaknesses: adaptiveData.weaknesses,
          performancePatterns: adaptiveData.performancePatterns,
          predictions: adaptiveData.predictions,
          recommendations: adaptiveData.recommendations,
          lastUpdated: adaptiveData.updatedAt
        }
      });

    } catch (error) {
      console.error('Get adaptive data error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب البيانات التكيفية'
      });
    }
  }
);

module.exports = router;
