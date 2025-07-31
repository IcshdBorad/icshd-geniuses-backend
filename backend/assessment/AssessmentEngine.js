/**
 * Assessment Engine for ICSHD GENIUSES
 * Analyzes student performance and provides detailed assessment reports
 */

const Session = require('../models/Session');
const User = require('../models/User');
const AdaptiveData = require('../models/AdaptiveData');
const Promotion = require('../models/Promotion');

class AssessmentEngine {
  constructor() {
    this.assessmentCriteria = {
      accuracy: {
        excellent: 95,
        good: 85,
        satisfactory: 70,
        needsImprovement: 50
      },
      speed: {
        excellent: 3, // seconds per question
        good: 5,
        satisfactory: 8,
        needsImprovement: 12
      },
      consistency: {
        excellent: 90, // consistency score
        good: 75,
        satisfactory: 60,
        needsImprovement: 40
      }
    };

    this.promotionCriteria = {
      minimumAccuracy: 85,
      maximumAverageTime: 6,
      requiredSuccessfulSessions: 3,
      minimumSessionsAtLevel: 5
    };

    this.performanceWeights = {
      accuracy: 0.4,
      speed: 0.3,
      consistency: 0.2,
      improvement: 0.1
    };
  }

  /**
   * Analyze a single session performance
   */
  async analyzeSession(sessionId) {
    try {
      const session = await Session.findById(sessionId)
        .populate('studentId', 'profile currentLevel')
        .populate('trainerId', 'profile');

      if (!session) {
        throw new Error('Session not found');
      }

      const analysis = {
        sessionId: session.sessionId,
        studentId: session.studentId._id,
        studentCode: session.studentCode,
        curriculum: session.curriculum,
        level: session.level,
        performance: this.calculateSessionPerformance(session),
        strengths: this.identifyStrengths(session),
        weaknesses: this.identifyWeaknesses(session),
        recommendations: this.generateSessionRecommendations(session),
        timeAnalysis: this.analyzeTimePerformance(session),
        errorAnalysis: this.analyzeErrors(session),
        difficultyProgression: this.analyzeDifficultyProgression(session),
        comparisonWithPrevious: await this.compareWithPreviousSessions(session),
        nextSteps: this.suggestNextSteps(session)
      };

      // Update adaptive data based on session analysis
      await this.updateAdaptiveData(session, analysis);

      return analysis;

    } catch (error) {
      console.error('Error analyzing session:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive session performance metrics
   */
  calculateSessionPerformance(session) {
    const totalQuestions = session.totalQuestions;
    const correctAnswers = session.correctAnswers;
    const incorrectAnswers = session.incorrectAnswers;
    const skippedQuestions = session.skippedQuestions;
    const duration = session.duration;
    const averageTime = session.averageTimePerQuestion;

    // Basic metrics
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const completionRate = totalQuestions > 0 ? ((correctAnswers + incorrectAnswers) / totalQuestions) * 100 : 0;
    const errorRate = totalQuestions > 0 ? (incorrectAnswers / totalQuestions) * 100 : 0;

    // Performance scores
    const accuracyScore = this.calculateAccuracyScore(accuracy);
    const speedScore = this.calculateSpeedScore(averageTime);
    const completionScore = this.calculateCompletionScore(completionRate);

    // Overall performance score
    const overallScore = (
      accuracyScore * this.performanceWeights.accuracy +
      speedScore * this.performanceWeights.speed +
      completionScore * this.performanceWeights.consistency
    );

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      averageTime: Math.round(averageTime * 100) / 100,
      totalDuration: duration,
      scores: {
        accuracy: accuracyScore,
        speed: speedScore,
        completion: completionScore,
        overall: Math.round(overallScore * 100) / 100
      },
      grade: this.calculateGrade(overallScore),
      level: this.getPerformanceLevel(overallScore)
    };
  }

  /**
   * Identify student strengths based on session data
   */
  identifyStrengths(session) {
    const strengths = [];
    const exercises = session.exercises || [];

    // Analyze by exercise type
    const typePerformance = this.groupPerformanceByType(exercises);
    Object.entries(typePerformance).forEach(([type, performance]) => {
      if (performance.accuracy >= 85) {
        strengths.push({
          area: type,
          accuracy: performance.accuracy,
          averageTime: performance.averageTime,
          description: this.getStrengthDescription(type, performance)
        });
      }
    });

    // Analyze speed strengths
    if (session.averageTimePerQuestion <= this.assessmentCriteria.speed.good) {
      strengths.push({
        area: 'speed',
        value: session.averageTimePerQuestion,
        description: 'سرعة ممتازة في الحل'
      });
    }

    // Analyze accuracy strengths
    if (session.accuracy >= this.assessmentCriteria.accuracy.good) {
      strengths.push({
        area: 'accuracy',
        value: session.accuracy,
        description: 'دقة عالية في الإجابات'
      });
    }

    return strengths;
  }

  /**
   * Identify areas needing improvement
   */
  identifyWeaknesses(session) {
    const weaknesses = [];
    const exercises = session.exercises || [];

    // Analyze by exercise type
    const typePerformance = this.groupPerformanceByType(exercises);
    Object.entries(typePerformance).forEach(([type, performance]) => {
      if (performance.accuracy < 70) {
        weaknesses.push({
          area: type,
          accuracy: performance.accuracy,
          averageTime: performance.averageTime,
          errorCount: performance.errors,
          description: this.getWeaknessDescription(type, performance),
          suggestions: this.getImprovementSuggestions(type, performance)
        });
      }
    });

    // Analyze speed issues
    if (session.averageTimePerQuestion > this.assessmentCriteria.speed.needsImprovement) {
      weaknesses.push({
        area: 'speed',
        value: session.averageTimePerQuestion,
        description: 'يحتاج لتحسين السرعة',
        suggestions: ['ممارسة تقنيات الحساب السريع', 'تمارين توقيت منتظمة']
      });
    }

    // Analyze accuracy issues
    if (session.accuracy < this.assessmentCriteria.accuracy.satisfactory) {
      weaknesses.push({
        area: 'accuracy',
        value: session.accuracy,
        description: 'يحتاج لتحسين الدقة',
        suggestions: ['مراجعة الأساسيات', 'التمرين بوتيرة أبطأ', 'التركيز على الفهم قبل السرعة']
      });
    }

    return weaknesses;
  }

  /**
   * Analyze time performance patterns
   */
  analyzeTimePerformance(session) {
    const exercises = session.exercises || [];
    const times = exercises.map(ex => ex.timeSpent).filter(time => time > 0);

    if (times.length === 0) {
      return { message: 'لا توجد بيانات وقت كافية للتحليل' };
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const standardDeviation = this.calculateStandardDeviation(times);

    // Time consistency analysis
    const consistency = standardDeviation < (averageTime * 0.3) ? 'متسق' : 'غير متسق';

    // Time trend analysis
    const timeTrend = this.analyzeTimeTrend(times);

    return {
      averageTime: Math.round(averageTime * 100) / 100,
      minTime: Math.round(minTime * 100) / 100,
      maxTime: Math.round(maxTime * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      consistency,
      trend: timeTrend,
      timeDistribution: this.calculateTimeDistribution(times),
      recommendations: this.generateTimeRecommendations(averageTime, consistency, timeTrend)
    };
  }

  /**
   * Analyze error patterns
   */
  analyzeErrors(session) {
    const exercises = session.exercises || [];
    const incorrectExercises = exercises.filter(ex => !ex.isCorrect);

    if (incorrectExercises.length === 0) {
      return { message: 'لا توجد أخطاء للتحليل - أداء ممتاز!' };
    }

    // Group errors by type
    const errorsByType = {};
    incorrectExercises.forEach(exercise => {
      const type = exercise.exerciseType || exercise.type || 'unknown';
      if (!errorsByType[type]) {
        errorsByType[type] = [];
      }
      errorsByType[type].push(exercise);
    });

    // Analyze error patterns
    const errorPatterns = Object.entries(errorsByType).map(([type, errors]) => ({
      type,
      count: errors.length,
      percentage: Math.round((errors.length / incorrectExercises.length) * 100),
      averageTime: errors.reduce((sum, ex) => sum + (ex.timeSpent || 0), 0) / errors.length,
      commonMistakes: this.identifyCommonMistakes(errors),
      suggestions: this.getErrorTypeSuggestions(type, errors)
    }));

    return {
      totalErrors: incorrectExercises.length,
      errorRate: Math.round((incorrectExercises.length / exercises.length) * 100),
      errorPatterns,
      mostProblematicArea: errorPatterns.reduce((max, current) => 
        current.count > max.count ? current : max, errorPatterns[0]),
      recommendations: this.generateErrorRecommendations(errorPatterns)
    };
  }

  /**
   * Compare with previous sessions
   */
  async compareWithPreviousSessions(currentSession) {
    try {
      const previousSessions = await Session.find({
        studentId: currentSession.studentId,
        curriculum: currentSession.curriculum,
        level: currentSession.level,
        _id: { $ne: currentSession._id }
      })
      .sort({ createdAt: -1 })
      .limit(5);

      if (previousSessions.length === 0) {
        return { message: 'هذه أول جلسة للطالب في هذا المستوى' };
      }

      const previousAvgAccuracy = previousSessions.reduce((sum, s) => sum + s.accuracy, 0) / previousSessions.length;
      const previousAvgTime = previousSessions.reduce((sum, s) => sum + s.averageTimePerQuestion, 0) / previousSessions.length;

      const accuracyImprovement = currentSession.accuracy - previousAvgAccuracy;
      const timeImprovement = previousAvgTime - currentSession.averageTimePerQuestion; // Positive means faster

      return {
        previousSessionsCount: previousSessions.length,
        accuracyComparison: {
          current: currentSession.accuracy,
          previous: Math.round(previousAvgAccuracy * 100) / 100,
          improvement: Math.round(accuracyImprovement * 100) / 100,
          trend: accuracyImprovement > 0 ? 'تحسن' : accuracyImprovement < 0 ? 'تراجع' : 'مستقر'
        },
        timeComparison: {
          current: currentSession.averageTimePerQuestion,
          previous: Math.round(previousAvgTime * 100) / 100,
          improvement: Math.round(timeImprovement * 100) / 100,
          trend: timeImprovement > 0 ? 'أسرع' : timeImprovement < 0 ? 'أبطأ' : 'مستقر'
        },
        overallTrend: this.calculateOverallTrend(accuracyImprovement, timeImprovement),
        progressAnalysis: this.analyzeProgress(currentSession, previousSessions)
      };

    } catch (error) {
      console.error('Error comparing with previous sessions:', error);
      return { error: 'خطأ في مقارنة الجلسات السابقة' };
    }
  }

  /**
   * Check if student is eligible for promotion
   */
  async checkPromotionEligibility(studentId, curriculum) {
    try {
      const recentSessions = await Session.find({
        studentId,
        curriculum,
        result: { $in: ['excellent', 'good'] }
      })
      .sort({ createdAt: -1 })
      .limit(5);

      if (recentSessions.length < this.promotionCriteria.requiredSuccessfulSessions) {
        return {
          eligible: false,
          reason: `يحتاج ${this.promotionCriteria.requiredSuccessfulSessions} جلسات ناجحة على الأقل`,
          currentSuccessfulSessions: recentSessions.length
        };
      }

      // Calculate averages from recent sessions
      const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
      const avgTime = recentSessions.reduce((sum, s) => sum + s.averageTimePerQuestion, 0) / recentSessions.length;

      // Check consecutive successful sessions
      const lastThreeSessions = recentSessions.slice(0, 3);
      const consecutiveSuccess = lastThreeSessions.every(session => 
        session.accuracy >= this.promotionCriteria.minimumAccuracy && 
        session.averageTimePerQuestion <= this.promotionCriteria.maximumAverageTime
      );

      const meetsAccuracy = avgAccuracy >= this.promotionCriteria.minimumAccuracy;
      const meetsSpeed = avgTime <= this.promotionCriteria.maximumAverageTime;

      const eligible = meetsAccuracy && meetsSpeed && consecutiveSuccess;

      return {
        eligible,
        criteria: {
          accuracy: {
            current: Math.round(avgAccuracy * 100) / 100,
            required: this.promotionCriteria.minimumAccuracy,
            met: meetsAccuracy
          },
          speed: {
            current: Math.round(avgTime * 100) / 100,
            required: this.promotionCriteria.maximumAverageTime,
            met: meetsSpeed
          },
          consecutiveSuccess: {
            current: consecutiveSuccess,
            required: true,
            met: consecutiveSuccess
          }
        },
        confidence: this.calculatePromotionConfidence(avgAccuracy, avgTime, consecutiveSuccess),
        recommendation: eligible ? 'ترقية إلى المستوى التالي' : 'متابعة التدريب في المستوى الحالي',
        sessionData: {
          recentSessionsCount: recentSessions.length,
          sessionIds: recentSessions.map(s => s._id)
        }
      };

    } catch (error) {
      console.error('Error checking promotion eligibility:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive student report
   */
  async generateStudentReport(studentId, curriculum, timeRange = 30) {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const sessions = await Session.find({
        studentId,
        curriculum,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: -1 });

      if (sessions.length === 0) {
        return {
          message: 'لا توجد جلسات في الفترة المحددة',
          student: {
            name: student.fullName,
            studentCode: student.studentCode,
            currentLevel: student.currentLevel[curriculum]
          }
        };
      }

      const report = {
        student: {
          name: student.fullName,
          studentCode: student.studentCode,
          currentLevel: student.currentLevel[curriculum],
          ageGroup: student.ageGroup
        },
        reportPeriod: {
          startDate,
          endDate: new Date(),
          totalDays: timeRange
        },
        summary: this.calculateReportSummary(sessions),
        performance: this.calculateOverallPerformance(sessions),
        progress: this.calculateProgressMetrics(sessions),
        strengths: this.identifyOverallStrengths(sessions),
        weaknesses: this.identifyOverallWeaknesses(sessions),
        recommendations: this.generateOverallRecommendations(sessions),
        promotionStatus: await this.checkPromotionEligibility(studentId, curriculum),
        sessionDetails: sessions.map(session => ({
          sessionId: session.sessionId,
          date: session.createdAt,
          accuracy: session.accuracy,
          averageTime: session.averageTimePerQuestion,
          result: session.result,
          totalQuestions: session.totalQuestions
        })),
        charts: this.generateChartData(sessions)
      };

      return report;

    } catch (error) {
      console.error('Error generating student report:', error);
      throw error;
    }
  }

  /**
   * Update adaptive data based on session analysis
   */
  async updateAdaptiveData(session, analysis) {
    try {
      let adaptiveData = await AdaptiveData.findOne({
        studentId: session.studentId,
        curriculum: session.curriculum
      });

      if (!adaptiveData) {
        adaptiveData = await AdaptiveData.createInitialData(
          session.studentId,
          session.studentCode,
          session.curriculum,
          session.level
        );
      }

      // Update performance patterns
      const exercises = session.exercises || [];
      for (const exercise of exercises) {
        await adaptiveData.updatePerformancePattern(
          exercise.exerciseType || exercise.type,
          exercise.subcategory || 'general',
          exercise.isCorrect,
          exercise.timeSpent || 0
        );
      }

      // Update predictions
      await adaptiveData.updatePredictions();

      // Add recommendations
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        adaptiveData.recommendations.immediate = analysis.recommendations.map(rec => ({
          type: 'session_analysis',
          description: rec,
          priority: 'medium',
          createdAt: new Date(),
          applied: false
        }));
      }

      await adaptiveData.save();

    } catch (error) {
      console.error('Error updating adaptive data:', error);
    }
  }

  /**
   * Utility methods for calculations
   */
  calculateAccuracyScore(accuracy) {
    if (accuracy >= this.assessmentCriteria.accuracy.excellent) return 100;
    if (accuracy >= this.assessmentCriteria.accuracy.good) return 85;
    if (accuracy >= this.assessmentCriteria.accuracy.satisfactory) return 70;
    if (accuracy >= this.assessmentCriteria.accuracy.needsImprovement) return 50;
    return Math.max(accuracy, 0);
  }

  calculateSpeedScore(averageTime) {
    if (averageTime <= this.assessmentCriteria.speed.excellent) return 100;
    if (averageTime <= this.assessmentCriteria.speed.good) return 85;
    if (averageTime <= this.assessmentCriteria.speed.satisfactory) return 70;
    if (averageTime <= this.assessmentCriteria.speed.needsImprovement) return 50;
    return Math.max(50 - (averageTime - this.assessmentCriteria.speed.needsImprovement) * 2, 0);
  }

  calculateCompletionScore(completionRate) {
    return Math.min(completionRate, 100);
  }

  calculateGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 65) return 'D+';
    if (score >= 60) return 'D';
    return 'F';
  }

  getPerformanceLevel(score) {
    if (score >= 90) return 'ممتاز';
    if (score >= 80) return 'جيد جداً';
    if (score >= 70) return 'جيد';
    if (score >= 60) return 'مقبول';
    return 'يحتاج تحسين';
  }

  groupPerformanceByType(exercises) {
    const groups = {};
    
    exercises.forEach(exercise => {
      const type = exercise.exerciseType || exercise.type || 'unknown';
      if (!groups[type]) {
        groups[type] = {
          total: 0,
          correct: 0,
          totalTime: 0,
          errors: 0
        };
      }
      
      groups[type].total++;
      if (exercise.isCorrect) {
        groups[type].correct++;
      } else {
        groups[type].errors++;
      }
      groups[type].totalTime += exercise.timeSpent || 0;
    });

    // Calculate percentages and averages
    Object.keys(groups).forEach(type => {
      const group = groups[type];
      group.accuracy = group.total > 0 ? (group.correct / group.total) * 100 : 0;
      group.averageTime = group.total > 0 ? group.totalTime / group.total : 0;
    });

    return groups;
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  analyzeTimeTrend(times) {
    if (times.length < 3) return 'غير كافي للتحليل';
    
    const firstHalf = times.slice(0, Math.floor(times.length / 2));
    const secondHalf = times.slice(Math.floor(times.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    
    const improvement = firstAvg - secondAvg;
    
    if (improvement > 1) return 'تحسن في السرعة';
    if (improvement < -1) return 'تراجع في السرعة';
    return 'مستقر';
  }

  calculateTimeDistribution(times) {
    const sorted = [...times].sort((a, b) => a - b);
    const length = sorted.length;
    
    return {
      min: sorted[0],
      max: sorted[length - 1],
      median: length % 2 === 0 ? 
        (sorted[length / 2 - 1] + sorted[length / 2]) / 2 : 
        sorted[Math.floor(length / 2)],
      q1: sorted[Math.floor(length * 0.25)],
      q3: sorted[Math.floor(length * 0.75)]
    };
  }

  calculatePromotionConfidence(accuracy, averageTime, consecutiveSuccess) {
    let confidence = 0;
    
    // Accuracy component (40%)
    confidence += Math.min(accuracy / this.promotionCriteria.minimumAccuracy, 1.2) * 0.4;
    
    // Speed component (30%)
    confidence += Math.min(this.promotionCriteria.maximumAverageTime / averageTime, 1.2) * 0.3;
    
    // Consistency component (30%)
    confidence += (consecutiveSuccess ? 1 : 0.5) * 0.3;
    
    return Math.min(Math.round(confidence * 100), 100);
  }

  // Placeholder methods for complex analysis
  identifyCommonMistakes(errors) {
    return ['خطأ في الحساب', 'خطأ في الفهم'];
  }

  getErrorTypeSuggestions(type, errors) {
    return [`مراجعة ${type}`, 'تمارين إضافية'];
  }

  generateSessionRecommendations(session) {
    const recommendations = [];
    
    if (session.accuracy < 70) {
      recommendations.push('ركز على الدقة قبل السرعة');
    }
    
    if (session.averageTimePerQuestion > 10) {
      recommendations.push('تدرب على تقنيات الحساب السريع');
    }
    
    return recommendations;
  }

  generateTimeRecommendations(averageTime, consistency, trend) {
    const recommendations = [];
    
    if (averageTime > 8) {
      recommendations.push('تدرب على السرعة');
    }
    
    if (consistency === 'غير متسق') {
      recommendations.push('ركز على الثبات في الأداء');
    }
    
    return recommendations;
  }

  generateErrorRecommendations(errorPatterns) {
    return ['مراجعة الأخطاء الشائعة', 'تمارين إضافية في المناطق الضعيفة'];
  }

  calculateOverallTrend(accuracyImprovement, timeImprovement) {
    if (accuracyImprovement > 0 && timeImprovement > 0) return 'تحسن ممتاز';
    if (accuracyImprovement > 0 || timeImprovement > 0) return 'تحسن';
    if (accuracyImprovement < 0 && timeImprovement < 0) return 'يحتاج انتباه';
    return 'مستقر';
  }

  analyzeProgress(currentSession, previousSessions) {
    return {
      trend: 'تحسن',
      details: 'تحليل مفصل للتقدم'
    };
  }

  suggestNextSteps(session) {
    return ['متابعة التدريب', 'التركيز على نقاط الضعف'];
  }

  getStrengthDescription(type, performance) {
    return `أداء ممتاز في ${type}`;
  }

  getWeaknessDescription(type, performance) {
    return `يحتاج تحسين في ${type}`;
  }

  getImprovementSuggestions(type, performance) {
    return [`تمارين إضافية في ${type}`];
  }

  // Report generation methods
  calculateReportSummary(sessions) {
    return {
      totalSessions: sessions.length,
      averageAccuracy: sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length,
      averageTime: sessions.reduce((sum, s) => sum + s.averageTimePerQuestion, 0) / sessions.length,
      totalQuestions: sessions.reduce((sum, s) => sum + s.totalQuestions, 0)
    };
  }

  calculateOverallPerformance(sessions) {
    return {
      trend: 'تحسن',
      consistency: 'جيد'
    };
  }

  calculateProgressMetrics(sessions) {
    return {
      improvement: 'ملحوظ',
      areas: ['السرعة', 'الدقة']
    };
  }

  identifyOverallStrengths(sessions) {
    return ['الدقة العالية', 'التحسن المستمر'];
  }

  identifyOverallWeaknesses(sessions) {
    return ['السرعة', 'بعض أنواع المسائل'];
  }

  generateOverallRecommendations(sessions) {
    return ['متابعة التدريب المنتظم', 'التركيز على السرعة'];
  }

  generateChartData(sessions) {
    return {
      accuracyTrend: sessions.map(s => ({ date: s.createdAt, value: s.accuracy })),
      timeTrend: sessions.map(s => ({ date: s.createdAt, value: s.averageTimePerQuestion }))
    };
  }
}

module.exports = AssessmentEngine;
