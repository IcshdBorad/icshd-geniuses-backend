const ReportsService = require('../services/ReportsService');
const { validationResult } = require('express-validator');
const moment = require('moment');

class ReportsController {
  constructor() {
    this.reportsService = new ReportsService();
  }

  // Generate student progress report
  async generateStudentReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { studentId } = req.params;
      const {
        startDate,
        endDate,
        format = 'pdf',
        includeGamification = true,
        includeSessions = true,
        includeAchievements = true
      } = req.query;

      // Validate permissions
      if (req.user.role !== 'admin' && req.user.role !== 'trainer' && req.user.id !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول إلى هذا التقرير'
        });
      }

      const options = {
        startDate: startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate(),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        includeGamification: includeGamification === 'true',
        includeSessions: includeSessions === 'true',
        includeAchievements: includeAchievements === 'true'
      };

      const report = await this.reportsService.generateStudentProgressReport(studentId, options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      // Send file download
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating student report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء التقرير',
        error: error.message
      });
    }
  }

  // Generate class performance report
  async generateClassReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const { classId } = req.params;
      const {
        startDate,
        endDate,
        format = 'pdf',
        includeIndividualStats = true,
        includeComparisons = true
      } = req.query;

      // Validate permissions
      if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول إلى هذا التقرير'
        });
      }

      const options = {
        startDate: startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate(),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        includeIndividualStats: includeIndividualStats === 'true',
        includeComparisons: includeComparisons === 'true'
      };

      const report = await this.reportsService.generateClassPerformanceReport(classId, options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      // Send file download
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating class report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء التقرير',
        error: error.message
      });
    }
  }

  // Generate gamification report
  async generateGamificationReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const {
        startDate,
        endDate,
        format = 'pdf',
        includeLeaderboards = true,
        includeAchievements = true
      } = req.query;

      // Validate permissions
      if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول إلى هذا التقرير'
        });
      }

      const options = {
        startDate: startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate(),
        endDate: endDate ? new Date(endDate) : new Date(),
        format,
        includeLeaderboards: includeLeaderboards === 'true',
        includeAchievements: includeAchievements === 'true'
      };

      const report = await this.reportsService.generateGamificationReport(options);

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      // Send file download
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating gamification report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء التقرير',
        error: error.message
      });
    }
  }

  // Get available report types
  async getReportTypes(req, res) {
    try {
      const reportTypes = [
        {
          id: 'student_progress',
          name: 'تقرير تقدم الطالب',
          description: 'تقرير شامل عن أداء وتقدم طالب واحد',
          formats: ['pdf', 'excel', 'json'],
          permissions: ['admin', 'trainer', 'student']
        },
        {
          id: 'class_performance',
          name: 'تقرير أداء الفصل',
          description: 'تقرير مقارن لأداء جميع طلاب الفصل',
          formats: ['pdf', 'excel', 'json'],
          permissions: ['admin', 'trainer']
        },
        {
          id: 'gamification_summary',
          name: 'تقرير نظام التحفيز',
          description: 'تقرير شامل عن إحصائيات نظام التحفيز والإنجازات',
          formats: ['pdf', 'excel', 'json'],
          permissions: ['admin', 'trainer']
        },
        {
          id: 'achievement_report',
          name: 'تقرير الإنجازات',
          description: 'تقرير مفصل عن الإنجازات المفتوحة والمكافآت',
          formats: ['pdf', 'excel', 'json'],
          permissions: ['admin', 'trainer']
        },
        {
          id: 'session_analytics',
          name: 'تحليلات الجلسات',
          description: 'تحليل مفصل لجلسات التدريب والأداء',
          formats: ['pdf', 'excel', 'json'],
          permissions: ['admin', 'trainer']
        }
      ];

      // Filter by user permissions
      const userRole = req.user.role;
      const availableReports = reportTypes.filter(report => 
        report.permissions.includes(userRole)
      );

      res.json({
        success: true,
        data: availableReports
      });

    } catch (error) {
      console.error('Error getting report types:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب أنواع التقارير',
        error: error.message
      });
    }
  }

  // Get report statistics
  async getReportStatistics(req, res) {
    try {
      const { type, startDate, endDate } = req.query;

      // Validate permissions
      if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بالوصول إلى هذه الإحصائيات'
        });
      }

      const dateRange = {
        startDate: startDate ? new Date(startDate) : moment().subtract(30, 'days').toDate(),
        endDate: endDate ? new Date(endDate) : new Date()
      };

      let statistics = {};

      switch (type) {
        case 'overview':
          statistics = await this.getOverviewStatistics(dateRange);
          break;
        case 'students':
          statistics = await this.getStudentStatistics(dateRange);
          break;
        case 'gamification':
          statistics = await this.getGamificationStatistics(dateRange);
          break;
        case 'sessions':
          statistics = await this.getSessionStatistics(dateRange);
          break;
        default:
          statistics = await this.getOverviewStatistics(dateRange);
      }

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Error getting report statistics:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات التقارير',
        error: error.message
      });
    }
  }

  // Get overview statistics
  async getOverviewStatistics(dateRange) {
    const User = require('../models/User');
    const Session = require('../models/Session');
    const { UserGamificationProfile } = require('../models/gamification/UserGamificationProfile');

    const { startDate, endDate } = dateRange;

    const [
      totalStudents,
      activeStudents,
      totalSessions,
      completedSessions,
      totalGamificationProfiles
    ] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ 
        role: 'student',
        lastLoginAt: { $gte: startDate }
      }),
      Session.countDocuments({ 
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      Session.countDocuments({ 
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }),
      UserGamificationProfile.countDocuments({})
    ]);

    return {
      totalStudents,
      activeStudents,
      totalSessions,
      completedSessions,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      totalGamificationProfiles,
      gamificationAdoptionRate: totalStudents > 0 ? (totalGamificationProfiles / totalStudents) * 100 : 0
    };
  }

  // Get student statistics
  async getStudentStatistics(dateRange) {
    const User = require('../models/User');
    const Session = require('../models/Session');

    const { startDate, endDate } = dateRange;

    // Get top performing students
    const topStudents = await Session.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$studentId',
          totalSessions: { $sum: 1 },
          totalExercises: { $sum: { $size: '$exercises' } },
          averageAccuracy: { $avg: '$statistics.accuracy' },
          totalTimeSpent: { $sum: '$duration' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $sort: { averageAccuracy: -1 }
      },
      {
        $limit: 10
      }
    ]);

    // Get activity distribution
    const activityDistribution = await Session.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return {
      topStudents,
      activityDistribution
    };
  }

  // Get gamification statistics
  async getGamificationStatistics(dateRange) {
    const { UserGamificationProfile } = require('../models/gamification/UserGamificationProfile');
    const { UserAchievement } = require('../models/gamification/UserAchievement');

    const { startDate, endDate } = dateRange;

    // Get level distribution
    const levelDistribution = await UserGamificationProfile.aggregate([
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get recent achievements
    const recentAchievements = await UserAchievement.aggregate([
      {
        $match: {
          unlockedAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$achievementId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'achievements',
          localField: '_id',
          foreignField: '_id',
          as: 'achievement'
        }
      },
      {
        $unwind: '$achievement'
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return {
      levelDistribution,
      recentAchievements
    };
  }

  // Get session statistics
  async getSessionStatistics(dateRange) {
    const Session = require('../models/Session');

    const { startDate, endDate } = dateRange;

    // Get session completion trends
    const completionTrends = await Session.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          statuses: {
            $push: {
              status: '$_id.status',
              count: '$count'
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get curriculum distribution
    const curriculumDistribution = await Session.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$curriculum',
          count: { $sum: 1 },
          averageAccuracy: { $avg: '$statistics.accuracy' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return {
      completionTrends,
      curriculumDistribution
    };
  }

  // Generate custom report
  async generateCustomReport(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'بيانات غير صحيحة',
          errors: errors.array()
        });
      }

      const {
        reportType,
        filters,
        format = 'pdf',
        includeCharts = true,
        includeRawData = false
      } = req.body;

      // Validate permissions
      if (req.user.role !== 'admin' && req.user.role !== 'trainer') {
        return res.status(403).json({
          success: false,
          message: 'غير مصرح لك بإنشاء تقارير مخصصة'
        });
      }

      // Generate custom report based on type and filters
      const report = await this.reportsService.generateCustomReport({
        reportType,
        filters,
        format,
        includeCharts,
        includeRawData,
        userId: req.user.id
      });

      if (format === 'json') {
        return res.json({
          success: true,
          data: report
        });
      }

      // Send file download
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.buffer);

    } catch (error) {
      console.error('Error generating custom report:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء التقرير المخصص',
        error: error.message
      });
    }
  }
}

module.exports = ReportsController;
