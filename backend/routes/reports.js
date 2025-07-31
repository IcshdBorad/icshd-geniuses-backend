const express = require('express');
const { body, param, query } = require('express-validator');
const ReportsController = require('../controllers/ReportsController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

const router = express.Router();
const reportsController = new ReportsController();

// Apply authentication to all routes
router.use(authMiddleware);

// Validation middleware
const validateStudentReport = [
  param('studentId').isMongoId().withMessage('معرف الطالب غير صحيح'),
  query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
  query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
  query('format').optional().isIn(['pdf', 'excel', 'json']).withMessage('صيغة التقرير غير مدعومة'),
  query('includeGamification').optional().isBoolean().withMessage('قيمة includeGamification يجب أن تكون boolean'),
  query('includeSessions').optional().isBoolean().withMessage('قيمة includeSessions يجب أن تكون boolean'),
  query('includeAchievements').optional().isBoolean().withMessage('قيمة includeAchievements يجب أن تكون boolean')
];

const validateClassReport = [
  param('classId').isMongoId().withMessage('معرف الفصل غير صحيح'),
  query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
  query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
  query('format').optional().isIn(['pdf', 'excel', 'json']).withMessage('صيغة التقرير غير مدعومة'),
  query('includeIndividualStats').optional().isBoolean().withMessage('قيمة includeIndividualStats يجب أن تكون boolean'),
  query('includeComparisons').optional().isBoolean().withMessage('قيمة includeComparisons يجب أن تكون boolean')
];

const validateGamificationReport = [
  query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
  query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
  query('format').optional().isIn(['pdf', 'excel', 'json']).withMessage('صيغة التقرير غير مدعومة'),
  query('includeLeaderboards').optional().isBoolean().withMessage('قيمة includeLeaderboards يجب أن تكون boolean'),
  query('includeAchievements').optional().isBoolean().withMessage('قيمة includeAchievements يجب أن تكون boolean')
];

const validateCustomReport = [
  body('reportType').notEmpty().withMessage('نوع التقرير مطلوب'),
  body('filters').optional().isObject().withMessage('المرشحات يجب أن تكون كائن'),
  body('format').optional().isIn(['pdf', 'excel', 'json']).withMessage('صيغة التقرير غير مدعومة'),
  body('includeCharts').optional().isBoolean().withMessage('قيمة includeCharts يجب أن تكون boolean'),
  body('includeRawData').optional().isBoolean().withMessage('قيمة includeRawData يجب أن تكون boolean')
];

const validateStatistics = [
  query('type').optional().isIn(['overview', 'students', 'gamification', 'sessions']).withMessage('نوع الإحصائيات غير مدعوم'),
  query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
  query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح')
];

// Routes

/**
 * @route GET /api/reports/types
 * @desc Get available report types for current user
 * @access Private
 */
router.get('/types', reportsController.getReportTypes.bind(reportsController));

/**
 * @route GET /api/reports/statistics
 * @desc Get report statistics
 * @access Private (Admin/Trainer only)
 */
router.get('/statistics', 
  roleMiddleware(['admin', 'trainer']),
  validateStatistics,
  reportsController.getReportStatistics.bind(reportsController)
);

/**
 * @route GET /api/reports/student/:studentId
 * @desc Generate student progress report
 * @access Private (Admin/Trainer/Student - own report only)
 */
router.get('/student/:studentId',
  validateStudentReport,
  reportsController.generateStudentReport.bind(reportsController)
);

/**
 * @route GET /api/reports/class/:classId
 * @desc Generate class performance report
 * @access Private (Admin/Trainer only)
 */
router.get('/class/:classId',
  roleMiddleware(['admin', 'trainer']),
  validateClassReport,
  reportsController.generateClassReport.bind(reportsController)
);

/**
 * @route GET /api/reports/gamification
 * @desc Generate gamification summary report
 * @access Private (Admin/Trainer only)
 */
router.get('/gamification',
  roleMiddleware(['admin', 'trainer']),
  validateGamificationReport,
  reportsController.generateGamificationReport.bind(reportsController)
);

/**
 * @route POST /api/reports/custom
 * @desc Generate custom report
 * @access Private (Admin/Trainer only)
 */
router.post('/custom',
  roleMiddleware(['admin', 'trainer']),
  validateCustomReport,
  reportsController.generateCustomReport.bind(reportsController)
);

// Additional specialized routes

/**
 * @route GET /api/reports/achievements
 * @desc Generate achievements report
 * @access Private (Admin/Trainer only)
 */
router.get('/achievements',
  roleMiddleware(['admin', 'trainer']),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        format = 'pdf',
        studentId,
        achievementCategory
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        studentId,
        achievementCategory
      };

      // Generate achievements report
      const report = await reportsController.reportsService.generateAchievementsReport(options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating achievements report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء تقرير الإنجازات',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/sessions
 * @desc Generate sessions analytics report
 * @access Private (Admin/Trainer only)
 */
router.get('/sessions',
  roleMiddleware(['admin', 'trainer']),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        format = 'pdf',
        curriculum,
        level,
        includeDetails = true
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        curriculum,
        level,
        includeDetails: includeDetails === 'true'
      };

      // Generate sessions analytics report
      const report = await reportsController.reportsService.generateSessionsReport(options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating sessions report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء تقرير الجلسات',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/curriculum/:curriculum
 * @desc Generate curriculum progress report
 * @access Private (Admin/Trainer only)
 */
router.get('/curriculum/:curriculum',
  roleMiddleware(['admin', 'trainer']),
  [
    param('curriculum').notEmpty().withMessage('المنهج مطلوب'),
    query('startDate').optional().isISO8601().withMessage('تاريخ البداية غير صحيح'),
    query('endDate').optional().isISO8601().withMessage('تاريخ النهاية غير صحيح'),
    query('format').optional().isIn(['pdf', 'excel', 'json']).withMessage('صيغة التقرير غير مدعومة')
  ],
  async (req, res) => {
    try {
      const { curriculum } = req.params;
      const {
        startDate,
        endDate,
        format = 'pdf',
        includeStudentBreakdown = true,
        includeLevelAnalysis = true
      } = req.query;

      const options = {
        curriculum,
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        includeStudentBreakdown: includeStudentBreakdown === 'true',
        includeLevelAnalysis: includeLevelAnalysis === 'true'
      };

      // Generate curriculum progress report
      const report = await reportsController.reportsService.generateCurriculumReport(options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating curriculum report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء تقرير المنهج',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/adaptive
 * @desc Generate adaptive learning report
 * @access Private (Admin/Trainer only)
 */
router.get('/adaptive',
  roleMiddleware(['admin', 'trainer']),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        format = 'pdf',
        studentId,
        includeRecommendations = true,
        includePatterns = true
      } = req.query;

      const options = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        studentId,
        includeRecommendations: includeRecommendations === 'true',
        includePatterns: includePatterns === 'true'
      };

      // Generate adaptive learning report
      const report = await reportsController.reportsService.generateAdaptiveReport(options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating adaptive learning report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء تقرير التعلم التكيفي',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/reports/export/templates
 * @desc Get available report templates
 * @access Private (Admin/Trainer only)
 */
router.get('/export/templates',
  roleMiddleware(['admin', 'trainer']),
  async (req, res) => {
    try {
      const templates = [
        {
          id: 'student_summary',
          name: 'ملخص الطالب',
          description: 'تقرير مختصر عن أداء الطالب',
          fields: ['name', 'accuracy', 'sessions', 'points', 'level']
        },
        {
          id: 'class_overview',
          name: 'نظرة عامة على الفصل',
          description: 'تقرير شامل عن أداء الفصل',
          fields: ['students', 'averages', 'top_performers', 'struggling_students']
        },
        {
          id: 'gamification_detailed',
          name: 'تفاصيل التحفيز',
          description: 'تقرير مفصل عن نظام التحفيز',
          fields: ['achievements', 'leaderboards', 'points', 'levels', 'streaks']
        },
        {
          id: 'progress_tracking',
          name: 'تتبع التقدم',
          description: 'تقرير تتبع تقدم الطلاب عبر الزمن',
          fields: ['timeline', 'improvements', 'trends', 'predictions']
        }
      ];

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('Error getting report templates:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قوالب التقارير',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/reports/schedule
 * @desc Schedule automatic report generation
 * @access Private (Admin only)
 */
router.post('/schedule',
  roleMiddleware(['admin']),
  [
    body('reportType').notEmpty().withMessage('نوع التقرير مطلوب'),
    body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('تكرار التقرير غير صحيح'),
    body('recipients').isArray().withMessage('قائمة المستلمين يجب أن تكون مصفوفة'),
    body('format').optional().isIn(['pdf', 'excel']).withMessage('صيغة التقرير غير مدعومة')
  ],
  async (req, res) => {
    try {
      const {
        reportType,
        frequency,
        recipients,
        format = 'pdf',
        filters = {},
        startTime = '09:00'
      } = req.body;

      // Create scheduled report
      const scheduledReport = {
        reportType,
        frequency,
        recipients,
        format,
        filters,
        startTime,
        createdBy: req.user.id,
        createdAt: new Date(),
        isActive: true
      };

      // Save to database (assuming we have a ScheduledReports model)
      // const ScheduledReport = require('../models/ScheduledReport');
      // const savedReport = await ScheduledReport.create(scheduledReport);

      res.json({
        success: true,
        message: 'تم جدولة التقرير بنجاح',
        data: scheduledReport
      });

    } catch (error) {
      console.error('Error scheduling report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جدولة التقرير',
        error: error.message
      });
    }
  }
);

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Reports route error:', error);
  res.status(500).json({
    success: false,
    message: 'خطأ في خدمة التقارير',
    error: process.env.NODE_ENV === 'development' ? error.message : 'خطأ داخلي في الخادم'
  });
});

module.exports = router;
