const User = require('../models/User');
const Session = require('../models/Session');
const { UserGamificationProfile } = require('../models/gamification/UserGamificationProfile');
const { Achievement } = require('../models/gamification/Achievement');
const { UserAchievement } = require('../models/gamification/UserAchievement');
const { Leaderboard } = require('../models/gamification/Leaderboard');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const moment = require('moment');

class ReportsService {
  constructor() {
    this.reportTypes = {
      STUDENT_PROGRESS: 'student_progress',
      CLASS_PERFORMANCE: 'class_performance',
      GAMIFICATION_SUMMARY: 'gamification_summary',
      ACHIEVEMENT_REPORT: 'achievement_report',
      SESSION_ANALYTICS: 'session_analytics',
      CURRICULUM_PROGRESS: 'curriculum_progress',
      ADAPTIVE_LEARNING: 'adaptive_learning'
    };
  }

  // Generate comprehensive student progress report
  async generateStudentProgressReport(studentId, options = {}) {
    try {
      const {
        startDate = moment().subtract(30, 'days').toDate(),
        endDate = new Date(),
        format = 'pdf',
        includeGamification = true,
        includeSessions = true,
        includeAchievements = true
      } = options;

      // Fetch student data
      const student = await User.findById(studentId).lean();
      if (!student) {
        throw new Error('Student not found');
      }

      // Fetch sessions data
      const sessions = await Session.find({
        studentId,
        createdAt: { $gte: startDate, $lte: endDate }
      }).sort({ createdAt: -1 }).lean();

      // Fetch gamification data
      let gamificationData = null;
      if (includeGamification) {
        gamificationData = await UserGamificationProfile.findOne({ userId: studentId }).lean();
      }

      // Fetch achievements
      let achievements = [];
      if (includeAchievements) {
        achievements = await UserAchievement.find({ userId: studentId })
          .populate('achievementId')
          .lean();
      }

      // Calculate statistics
      const stats = this.calculateStudentStats(sessions, gamificationData);

      const reportData = {
        student,
        sessions,
        gamificationData,
        achievements,
        stats,
        dateRange: { startDate, endDate },
        generatedAt: new Date()
      };

      // Generate report based on format
      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'student_progress');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'student_progress');
      } else {
        return reportData; // Return raw data for JSON format
      }

    } catch (error) {
      console.error('Error generating student progress report:', error);
      throw error;
    }
  }

  // Generate class performance report
  async generateClassPerformanceReport(classId, options = {}) {
    try {
      const {
        startDate = moment().subtract(30, 'days').toDate(),
        endDate = new Date(),
        format = 'pdf',
        includeIndividualStats = true,
        includeComparisons = true
      } = options;

      // Fetch class students
      const students = await User.find({ 
        role: 'student',
        classId: classId 
      }).lean();

      if (!students.length) {
        throw new Error('No students found in this class');
      }

      const studentIds = students.map(s => s._id);

      // Fetch all sessions for the class
      const sessions = await Session.find({
        studentId: { $in: studentIds },
        createdAt: { $gte: startDate, $lte: endDate }
      }).lean();

      // Fetch gamification data for all students
      const gamificationProfiles = await UserGamificationProfile.find({
        userId: { $in: studentIds }
      }).lean();

      // Calculate class statistics
      const classStats = this.calculateClassStats(students, sessions, gamificationProfiles);

      const reportData = {
        classId,
        students,
        sessions,
        gamificationProfiles,
        classStats,
        dateRange: { startDate, endDate },
        generatedAt: new Date()
      };

      // Generate report based on format
      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'class_performance');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'class_performance');
      } else {
        return reportData;
      }

    } catch (error) {
      console.error('Error generating class performance report:', error);
      throw error;
    }
  }

  // Generate gamification summary report
  async generateGamificationReport(options = {}) {
    try {
      const {
        startDate = moment().subtract(30, 'days').toDate(),
        endDate = new Date(),
        format = 'pdf',
        includeLeaderboards = true,
        includeAchievements = true
      } = options;

      // Fetch gamification profiles
      const profiles = await UserGamificationProfile.find({
        updatedAt: { $gte: startDate, $lte: endDate }
      }).populate('userId', 'username email profile').lean();

      // Fetch achievements data
      let achievementsData = [];
      if (includeAchievements) {
        achievementsData = await UserAchievement.find({
          unlockedAt: { $gte: startDate, $lte: endDate }
        }).populate('userId', 'username')
          .populate('achievementId')
          .lean();
      }

      // Fetch leaderboards
      let leaderboards = [];
      if (includeLeaderboards) {
        leaderboards = await Leaderboard.find({
          period: 'monthly',
          createdAt: { $gte: startDate, $lte: endDate }
        }).lean();
      }

      // Calculate gamification statistics
      const gamificationStats = this.calculateGamificationStats(profiles, achievementsData, leaderboards);

      const reportData = {
        profiles,
        achievementsData,
        leaderboards,
        gamificationStats,
        dateRange: { startDate, endDate },
        generatedAt: new Date()
      };

      // Generate report based on format
      if (format === 'pdf') {
        return await this.generatePDFReport(reportData, 'gamification_summary');
      } else if (format === 'excel') {
        return await this.generateExcelReport(reportData, 'gamification_summary');
      } else {
        return reportData;
      }

    } catch (error) {
      console.error('Error generating gamification report:', error);
      throw error;
    }
  }

  // Calculate student statistics
  calculateStudentStats(sessions, gamificationData) {
    const stats = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalExercises: sessions.reduce((sum, s) => sum + s.exercises.length, 0),
      correctAnswers: 0,
      totalAnswers: 0,
      averageAccuracy: 0,
      averageSpeed: 0,
      totalTimeSpent: 0,
      currentStreak: 0,
      longestStreak: 0,
      improvementTrend: 'stable'
    };

    // Calculate accuracy and speed
    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        if (exercise.submittedAnswer !== null) {
          stats.totalAnswers++;
          if (exercise.isCorrect) {
            stats.correctAnswers++;
          }
          stats.totalTimeSpent += exercise.timeSpent || 0;
        }
      });
    });

    if (stats.totalAnswers > 0) {
      stats.averageAccuracy = (stats.correctAnswers / stats.totalAnswers) * 100;
      stats.averageSpeed = stats.totalTimeSpent / stats.totalAnswers;
    }

    // Add gamification stats
    if (gamificationData) {
      stats.currentStreak = gamificationData.currentStreak || 0;
      stats.longestStreak = gamificationData.longestStreak || 0;
      stats.totalPoints = gamificationData.totalPoints || 0;
      stats.currentLevel = gamificationData.level || 1;
      stats.totalExperience = gamificationData.experience || 0;
    }

    // Calculate improvement trend
    if (sessions.length >= 5) {
      const recentSessions = sessions.slice(0, 5);
      const olderSessions = sessions.slice(-5);
      
      const recentAccuracy = this.calculateSessionsAccuracy(recentSessions);
      const olderAccuracy = this.calculateSessionsAccuracy(olderSessions);
      
      if (recentAccuracy > olderAccuracy + 5) {
        stats.improvementTrend = 'improving';
      } else if (recentAccuracy < olderAccuracy - 5) {
        stats.improvementTrend = 'declining';
      }
    }

    return stats;
  }

  // Calculate class statistics
  calculateClassStats(students, sessions, gamificationProfiles) {
    const stats = {
      totalStudents: students.length,
      activeStudents: 0,
      totalSessions: sessions.length,
      averageAccuracy: 0,
      averageSpeed: 0,
      topPerformers: [],
      strugglingStudents: [],
      classLeaderboard: []
    };

    // Group sessions by student
    const sessionsByStudent = {};
    sessions.forEach(session => {
      const studentId = session.studentId.toString();
      if (!sessionsByStudent[studentId]) {
        sessionsByStudent[studentId] = [];
      }
      sessionsByStudent[studentId].push(session);
    });

    // Calculate individual student stats
    const studentStats = students.map(student => {
      const studentSessions = sessionsByStudent[student._id.toString()] || [];
      const gamificationProfile = gamificationProfiles.find(p => 
        p.userId.toString() === student._id.toString()
      );
      
      const individualStats = this.calculateStudentStats(studentSessions, gamificationProfile);
      
      return {
        student,
        stats: individualStats
      };
    });

    // Calculate class averages
    const activeStudentStats = studentStats.filter(s => s.stats.totalSessions > 0);
    stats.activeStudents = activeStudentStats.length;

    if (activeStudentStats.length > 0) {
      stats.averageAccuracy = activeStudentStats.reduce((sum, s) => 
        sum + s.stats.averageAccuracy, 0) / activeStudentStats.length;
      
      stats.averageSpeed = activeStudentStats.reduce((sum, s) => 
        sum + s.stats.averageSpeed, 0) / activeStudentStats.length;
    }

    // Identify top performers and struggling students
    const sortedByAccuracy = activeStudentStats.sort((a, b) => 
      b.stats.averageAccuracy - a.stats.averageAccuracy);
    
    stats.topPerformers = sortedByAccuracy.slice(0, 5);
    stats.strugglingStudents = sortedByAccuracy.slice(-5).reverse();

    // Create class leaderboard
    stats.classLeaderboard = activeStudentStats
      .sort((a, b) => (b.stats.totalPoints || 0) - (a.stats.totalPoints || 0))
      .slice(0, 10);

    return stats;
  }

  // Calculate gamification statistics
  calculateGamificationStats(profiles, achievements, leaderboards) {
    const stats = {
      totalActiveUsers: profiles.length,
      totalPointsAwarded: 0,
      totalAchievementsUnlocked: achievements.length,
      averageLevel: 0,
      mostPopularAchievements: [],
      levelDistribution: {},
      pointsDistribution: {}
    };

    // Calculate totals and averages
    profiles.forEach(profile => {
      stats.totalPointsAwarded += profile.totalPoints || 0;
      
      const level = profile.level || 1;
      stats.levelDistribution[level] = (stats.levelDistribution[level] || 0) + 1;
      
      const pointsRange = this.getPointsRange(profile.totalPoints || 0);
      stats.pointsDistribution[pointsRange] = (stats.pointsDistribution[pointsRange] || 0) + 1;
    });

    if (profiles.length > 0) {
      stats.averageLevel = profiles.reduce((sum, p) => sum + (p.level || 1), 0) / profiles.length;
    }

    // Find most popular achievements
    const achievementCounts = {};
    achievements.forEach(achievement => {
      const achievementId = achievement.achievementId._id.toString();
      achievementCounts[achievementId] = (achievementCounts[achievementId] || 0) + 1;
    });

    stats.mostPopularAchievements = Object.entries(achievementCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([achievementId, count]) => {
        const achievement = achievements.find(a => 
          a.achievementId._id.toString() === achievementId
        );
        return {
          achievement: achievement.achievementId,
          unlockedCount: count
        };
      });

    return stats;
  }

  // Helper method to calculate sessions accuracy
  calculateSessionsAccuracy(sessions) {
    let totalAnswers = 0;
    let correctAnswers = 0;

    sessions.forEach(session => {
      session.exercises.forEach(exercise => {
        if (exercise.submittedAnswer !== null) {
          totalAnswers++;
          if (exercise.isCorrect) {
            correctAnswers++;
          }
        }
      });
    });

    return totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
  }

  // Helper method to get points range
  getPointsRange(points) {
    if (points < 100) return '0-99';
    if (points < 500) return '100-499';
    if (points < 1000) return '500-999';
    if (points < 2000) return '1000-1999';
    if (points < 5000) return '2000-4999';
    return '5000+';
  }

  // Generate PDF report
  async generatePDFReport(data, reportType) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve({
            buffer: pdfBuffer,
            filename: `${reportType}_${moment().format('YYYY-MM-DD')}.pdf`,
            contentType: 'application/pdf'
          });
        });

        // Generate PDF content based on report type
        this.generatePDFContent(doc, data, reportType);
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // Generate Excel report
  async generateExcelReport(data, reportType) {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // Generate Excel content based on report type
      await this.generateExcelContent(workbook, data, reportType);

      const buffer = await workbook.xlsx.writeBuffer();
      
      return {
        buffer,
        filename: `${reportType}_${moment().format('YYYY-MM-DD')}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      };

    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw error;
    }
  }

  // Generate PDF content
  generatePDFContent(doc, data, reportType) {
    // Add header
    doc.fontSize(20).text('ICSHD GENIUSES - تقرير الأداء', { align: 'center' });
    doc.fontSize(14).text(`نوع التقرير: ${this.getReportTypeArabic(reportType)}`, { align: 'center' });
    doc.fontSize(12).text(`تاريخ الإنشاء: ${moment().format('YYYY-MM-DD HH:mm')}`, { align: 'center' });
    doc.moveDown();

    // Generate content based on report type
    switch (reportType) {
      case 'student_progress':
        this.generateStudentProgressPDF(doc, data);
        break;
      case 'class_performance':
        this.generateClassPerformancePDF(doc, data);
        break;
      case 'gamification_summary':
        this.generateGamificationPDF(doc, data);
        break;
    }
  }

  // Generate Excel content
  async generateExcelContent(workbook, data, reportType) {
    // Generate content based on report type
    switch (reportType) {
      case 'student_progress':
        await this.generateStudentProgressExcel(workbook, data);
        break;
      case 'class_performance':
        await this.generateClassPerformanceExcel(workbook, data);
        break;
      case 'gamification_summary':
        await this.generateGamificationExcel(workbook, data);
        break;
    }
  }

  // Generate student progress PDF content
  generateStudentProgressPDF(doc, data) {
    const { student, stats, sessions } = data;

    doc.fontSize(16).text(`تقرير أداء الطالب: ${student.username}`, { align: 'right' });
    doc.moveDown();

    // Statistics section
    doc.fontSize(14).text('الإحصائيات العامة:', { align: 'right' });
    doc.fontSize(12);
    doc.text(`إجمالي الجلسات: ${stats.totalSessions}`, { align: 'right' });
    doc.text(`الجلسات المكتملة: ${stats.completedSessions}`, { align: 'right' });
    doc.text(`معدل الدقة: ${stats.averageAccuracy.toFixed(2)}%`, { align: 'right' });
    doc.text(`متوسط السرعة: ${stats.averageSpeed.toFixed(2)} ثانية`, { align: 'right' });
    doc.text(`النقاط الإجمالية: ${stats.totalPoints || 0}`, { align: 'right' });
    doc.text(`المستوى الحالي: ${stats.currentLevel || 1}`, { align: 'right' });
    doc.moveDown();

    // Recent sessions
    if (sessions.length > 0) {
      doc.fontSize(14).text('الجلسات الأخيرة:', { align: 'right' });
      doc.fontSize(10);
      
      sessions.slice(0, 10).forEach(session => {
        const accuracy = this.calculateSessionsAccuracy([session]);
        doc.text(`${moment(session.createdAt).format('YYYY-MM-DD')} - دقة: ${accuracy.toFixed(1)}% - تمارين: ${session.exercises.length}`, { align: 'right' });
      });
    }
  }

  // Generate student progress Excel content
  async generateStudentProgressExcel(workbook, data) {
    const { student, stats, sessions } = data;

    // Summary sheet
    const summarySheet = workbook.addWorksheet('ملخص الأداء');
    summarySheet.addRow(['معلومات الطالب', '']);
    summarySheet.addRow(['اسم المستخدم', student.username]);
    summarySheet.addRow(['البريد الإلكتروني', student.email]);
    summarySheet.addRow(['', '']);
    summarySheet.addRow(['الإحصائيات', '']);
    summarySheet.addRow(['إجمالي الجلسات', stats.totalSessions]);
    summarySheet.addRow(['الجلسات المكتملة', stats.completedSessions]);
    summarySheet.addRow(['معدل الدقة (%)', stats.averageAccuracy.toFixed(2)]);
    summarySheet.addRow(['متوسط السرعة (ثانية)', stats.averageSpeed.toFixed(2)]);
    summarySheet.addRow(['النقاط الإجمالية', stats.totalPoints || 0]);
    summarySheet.addRow(['المستوى الحالي', stats.currentLevel || 1]);

    // Sessions sheet
    const sessionsSheet = workbook.addWorksheet('تفاصيل الجلسات');
    sessionsSheet.addRow(['التاريخ', 'الحالة', 'عدد التمارين', 'الدقة (%)', 'الوقت المستغرق (دقيقة)']);
    
    sessions.forEach(session => {
      const accuracy = this.calculateSessionsAccuracy([session]);
      const duration = session.duration ? (session.duration / 60000).toFixed(1) : 0;
      
      sessionsSheet.addRow([
        moment(session.createdAt).format('YYYY-MM-DD HH:mm'),
        session.status,
        session.exercises.length,
        accuracy.toFixed(1),
        duration
      ]);
    });
  }

  // Generate class performance PDF content
  generateClassPerformancePDF(doc, data) {
    const { classStats, students } = data;

    doc.fontSize(16).text('تقرير أداء الفصل', { align: 'right' });
    doc.moveDown();

    doc.fontSize(14).text('إحصائيات الفصل:', { align: 'right' });
    doc.fontSize(12);
    doc.text(`إجمالي الطلاب: ${classStats.totalStudents}`, { align: 'right' });
    doc.text(`الطلاب النشطون: ${classStats.activeStudents}`, { align: 'right' });
    doc.text(`متوسط الدقة: ${classStats.averageAccuracy.toFixed(2)}%`, { align: 'right' });
    doc.text(`متوسط السرعة: ${classStats.averageSpeed.toFixed(2)} ثانية`, { align: 'right' });
    doc.moveDown();

    // Top performers
    if (classStats.topPerformers.length > 0) {
      doc.fontSize(14).text('أفضل الطلاب أداءً:', { align: 'right' });
      doc.fontSize(10);
      
      classStats.topPerformers.forEach((performer, index) => {
        doc.text(`${index + 1}. ${performer.student.username} - دقة: ${performer.stats.averageAccuracy.toFixed(1)}%`, { align: 'right' });
      });
    }
  }

  // Generate class performance Excel content
  async generateClassPerformanceExcel(workbook, data) {
    const { classStats, students } = data;

    // Class summary sheet
    const summarySheet = workbook.addWorksheet('ملخص الفصل');
    summarySheet.addRow(['إحصائيات الفصل', '']);
    summarySheet.addRow(['إجمالي الطلاب', classStats.totalStudents]);
    summarySheet.addRow(['الطلاب النشطون', classStats.activeStudents]);
    summarySheet.addRow(['متوسط الدقة (%)', classStats.averageAccuracy.toFixed(2)]);
    summarySheet.addRow(['متوسط السرعة (ثانية)', classStats.averageSpeed.toFixed(2)]);

    // Students details sheet
    const studentsSheet = workbook.addWorksheet('تفاصيل الطلاب');
    studentsSheet.addRow(['اسم الطالب', 'البريد الإلكتروني', 'عدد الجلسات', 'الدقة (%)', 'النقاط']);
    
    students.forEach(student => {
      const studentStats = classStats.topPerformers.find(p => 
        p.student._id.toString() === student._id.toString()
      );
      
      if (studentStats) {
        studentsSheet.addRow([
          student.username,
          student.email,
          studentStats.stats.totalSessions,
          studentStats.stats.averageAccuracy.toFixed(1),
          studentStats.stats.totalPoints || 0
        ]);
      }
    });
  }

  // Generate gamification PDF content
  generateGamificationPDF(doc, data) {
    const { gamificationStats, profiles } = data;

    doc.fontSize(16).text('تقرير نظام التحفيز', { align: 'right' });
    doc.moveDown();

    doc.fontSize(14).text('إحصائيات التحفيز:', { align: 'right' });
    doc.fontSize(12);
    doc.text(`إجمالي المستخدمين النشطين: ${gamificationStats.totalActiveUsers}`, { align: 'right' });
    doc.text(`إجمالي النقاط الممنوحة: ${gamificationStats.totalPointsAwarded}`, { align: 'right' });
    doc.text(`إجمالي الإنجازات المفتوحة: ${gamificationStats.totalAchievementsUnlocked}`, { align: 'right' });
    doc.text(`متوسط المستوى: ${gamificationStats.averageLevel.toFixed(1)}`, { align: 'right' });
    doc.moveDown();

    // Level distribution
    doc.fontSize(14).text('توزيع المستويات:', { align: 'right' });
    doc.fontSize(10);
    Object.entries(gamificationStats.levelDistribution).forEach(([level, count]) => {
      doc.text(`المستوى ${level}: ${count} طالب`, { align: 'right' });
    });
  }

  // Generate gamification Excel content
  async generateGamificationExcel(workbook, data) {
    const { gamificationStats, profiles, achievementsData } = data;

    // Summary sheet
    const summarySheet = workbook.addWorksheet('ملخص التحفيز');
    summarySheet.addRow(['إحصائيات التحفيز', '']);
    summarySheet.addRow(['إجمالي المستخدمين النشطين', gamificationStats.totalActiveUsers]);
    summarySheet.addRow(['إجمالي النقاط الممنوحة', gamificationStats.totalPointsAwarded]);
    summarySheet.addRow(['إجمالي الإنجازات المفتوحة', gamificationStats.totalAchievementsUnlocked]);
    summarySheet.addRow(['متوسط المستوى', gamificationStats.averageLevel.toFixed(1)]);

    // Profiles sheet
    const profilesSheet = workbook.addWorksheet('ملفات المستخدمين');
    profilesSheet.addRow(['اسم المستخدم', 'المستوى', 'النقاط', 'الخبرة', 'السلسلة الحالية']);
    
    profiles.forEach(profile => {
      profilesSheet.addRow([
        profile.userId.username,
        profile.level || 1,
        profile.totalPoints || 0,
        profile.experience || 0,
        profile.currentStreak || 0
      ]);
    });

    // Achievements sheet
    const achievementsSheet = workbook.addWorksheet('الإنجازات');
    achievementsSheet.addRow(['اسم المستخدم', 'الإنجاز', 'تاريخ الفتح', 'النقاط المكتسبة']);
    
    achievementsData.forEach(achievement => {
      achievementsSheet.addRow([
        achievement.userId.username,
        achievement.achievementId.title.ar,
        moment(achievement.unlockedAt).format('YYYY-MM-DD'),
        achievement.achievementId.rewards.points
      ]);
    });
  }

  // Get report type in Arabic
  getReportTypeArabic(reportType) {
    const types = {
      'student_progress': 'تقرير تقدم الطالب',
      'class_performance': 'تقرير أداء الفصل',
      'gamification_summary': 'تقرير نظام التحفيز',
      'achievement_report': 'تقرير الإنجازات',
      'session_analytics': 'تحليلات الجلسات',
      'curriculum_progress': 'تقرير تقدم المنهج',
      'adaptive_learning': 'تقرير التعلم التكيفي'
    };
    return types[reportType] || reportType;
  }
}

module.exports = ReportsService;
