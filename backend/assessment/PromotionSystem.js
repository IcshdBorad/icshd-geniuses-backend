/**
 * Promotion System for ICSHD GENIUSES
 * Handles automatic student promotions based on performance criteria
 */

const Session = require('../models/Session');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
const AdaptiveData = require('../models/AdaptiveData');
const AssessmentEngine = require('./AssessmentEngine');

class PromotionSystem {
  constructor() {
    this.assessmentEngine = new AssessmentEngine();
    
    // Promotion criteria by curriculum
    this.promotionCriteria = {
      soroban: {
        levels: {
          'beginner': {
            minimumAccuracy: 80,
            maximumAverageTime: 8,
            requiredSuccessfulSessions: 3,
            minimumSessionsAtLevel: 5,
            consistencyThreshold: 75
          },
          'elementary': {
            minimumAccuracy: 85,
            maximumAverageTime: 6,
            requiredSuccessfulSessions: 4,
            minimumSessionsAtLevel: 6,
            consistencyThreshold: 80
          },
          'intermediate': {
            minimumAccuracy: 90,
            maximumAverageTime: 5,
            requiredSuccessfulSessions: 5,
            minimumSessionsAtLevel: 8,
            consistencyThreshold: 85
          },
          'advanced': {
            minimumAccuracy: 95,
            maximumAverageTime: 4,
            requiredSuccessfulSessions: 6,
            minimumSessionsAtLevel: 10,
            consistencyThreshold: 90
          }
        }
      },
      vedic: {
        levels: {
          'beginner': {
            minimumAccuracy: 75,
            maximumAverageTime: 10,
            requiredSuccessfulSessions: 3,
            minimumSessionsAtLevel: 5,
            consistencyThreshold: 70
          },
          'elementary': {
            minimumAccuracy: 80,
            maximumAverageTime: 8,
            requiredSuccessfulSessions: 4,
            minimumSessionsAtLevel: 6,
            consistencyThreshold: 75
          },
          'intermediate': {
            minimumAccuracy: 85,
            maximumAverageTime: 6,
            requiredSuccessfulSessions: 5,
            minimumSessionsAtLevel: 8,
            consistencyThreshold: 80
          },
          'advanced': {
            minimumAccuracy: 90,
            maximumAverageTime: 5,
            requiredSuccessfulSessions: 6,
            minimumSessionsAtLevel: 10,
            consistencyThreshold: 85
          }
        }
      },
      logic: {
        levels: {
          'grade1-2': {
            minimumAccuracy: 70,
            maximumAverageTime: 15,
            requiredSuccessfulSessions: 3,
            minimumSessionsAtLevel: 4,
            consistencyThreshold: 65
          },
          'grade3-4': {
            minimumAccuracy: 75,
            maximumAverageTime: 12,
            requiredSuccessfulSessions: 4,
            minimumSessionsAtLevel: 5,
            consistencyThreshold: 70
          },
          'grade5-6': {
            minimumAccuracy: 80,
            maximumAverageTime: 10,
            requiredSuccessfulSessions: 4,
            minimumSessionsAtLevel: 6,
            consistencyThreshold: 75
          },
          'grade7-8': {
            minimumAccuracy: 85,
            maximumAverageTime: 8,
            requiredSuccessfulSessions: 5,
            minimumSessionsAtLevel: 7,
            consistencyThreshold: 80
          }
        }
      },
      iqgames: {
        levels: {
          'easy': {
            minimumAccuracy: 70,
            maximumAverageTime: 20,
            requiredSuccessfulSessions: 3,
            minimumSessionsAtLevel: 4,
            consistencyThreshold: 65
          },
          'medium': {
            minimumAccuracy: 75,
            maximumAverageTime: 15,
            requiredSuccessfulSessions: 4,
            minimumSessionsAtLevel: 5,
            consistencyThreshold: 70
          },
          'hard': {
            minimumAccuracy: 80,
            maximumAverageTime: 12,
            requiredSuccessfulSessions: 5,
            minimumSessionsAtLevel: 6,
            consistencyThreshold: 75
          },
          'expert': {
            minimumAccuracy: 85,
            maximumAverageTime: 10,
            requiredSuccessfulSessions: 6,
            minimumSessionsAtLevel: 8,
            consistencyThreshold: 80
          }
        }
      }
    };

    // Level progression mapping
    this.levelProgression = {
      soroban: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
      vedic: ['beginner', 'elementary', 'intermediate', 'advanced', 'expert'],
      logic: ['grade1-2', 'grade3-4', 'grade5-6', 'grade7-8', 'grade9-10'],
      iqgames: ['easy', 'medium', 'hard', 'expert', 'master']
    };

    // Promotion weights for different factors
    this.promotionWeights = {
      accuracy: 0.35,
      speed: 0.25,
      consistency: 0.20,
      improvement: 0.15,
      sessionCount: 0.05
    };
  }

  /**
   * Check if student is eligible for promotion after a session
   */
  async checkPromotionEligibility(studentId, curriculum, currentLevel) {
    try {
      console.log(`Checking promotion eligibility for student ${studentId} in ${curriculum} level ${currentLevel}`);

      // Get criteria for current level
      const criteria = this.getCriteriaForLevel(curriculum, currentLevel);
      if (!criteria) {
        return {
          eligible: false,
          reason: 'معايير الترقية غير محددة لهذا المستوى',
          criteria: null
        };
      }

      // Get recent sessions for analysis
      const recentSessions = await this.getRecentSessions(studentId, curriculum, currentLevel);
      
      if (recentSessions.length < criteria.minimumSessionsAtLevel) {
        return {
          eligible: false,
          reason: `يحتاج ${criteria.minimumSessionsAtLevel} جلسات على الأقل في هذا المستوى`,
          currentSessions: recentSessions.length,
          requiredSessions: criteria.minimumSessionsAtLevel,
          criteria
        };
      }

      // Analyze performance metrics
      const performanceAnalysis = await this.analyzePerformanceForPromotion(recentSessions, criteria);
      
      // Check if all criteria are met
      const eligibilityResult = this.evaluatePromotionCriteria(performanceAnalysis, criteria);
      
      // Calculate promotion confidence score
      const confidenceScore = this.calculatePromotionConfidence(performanceAnalysis, criteria);
      
      // Get next level
      const nextLevel = this.getNextLevel(curriculum, currentLevel);
      
      return {
        eligible: eligibilityResult.eligible,
        confidence: confidenceScore,
        nextLevel,
        currentLevel,
        criteria,
        performance: performanceAnalysis,
        evaluation: eligibilityResult,
        recommendation: this.generatePromotionRecommendation(eligibilityResult, confidenceScore),
        sessionData: {
          totalSessions: recentSessions.length,
          sessionIds: recentSessions.map(s => s._id),
          dateRange: {
            from: recentSessions[recentSessions.length - 1]?.createdAt,
            to: recentSessions[0]?.createdAt
          }
        }
      };

    } catch (error) {
      console.error('Error checking promotion eligibility:', error);
      throw error;
    }
  }

  /**
   * Process automatic promotion for eligible students
   */
  async processAutomaticPromotion(studentId, curriculum, eligibilityResult) {
    try {
      if (!eligibilityResult.eligible) {
        throw new Error('Student is not eligible for promotion');
      }

      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Create promotion record
      const promotionData = {
        studentId,
        studentCode: student.studentCode,
        curriculum,
        fromLevel: eligibilityResult.currentLevel,
        toLevel: eligibilityResult.nextLevel,
        type: 'automatic',
        criteria: eligibilityResult.criteria,
        performance: eligibilityResult.performance,
        confidence: eligibilityResult.confidence,
        sessionIds: eligibilityResult.sessionData.sessionIds,
        status: eligibilityResult.confidence >= 85 ? 'approved' : 'pending',
        approvedBy: eligibilityResult.confidence >= 85 ? 'system' : null,
        approvedAt: eligibilityResult.confidence >= 85 ? new Date() : null,
        notes: `ترقية تلقائية بناء على الأداء - مستوى الثقة: ${eligibilityResult.confidence}%`
      };

      const promotion = await Promotion.create(promotionData);

      // If auto-approved, update student level
      if (promotion.status === 'approved') {
        await this.executePromotion(studentId, curriculum, eligibilityResult.nextLevel, promotion._id);
      }

      // Update adaptive data
      await this.updateAdaptiveDataForPromotion(studentId, curriculum, promotion);

      // Log promotion event
      console.log(`Promotion ${promotion.status} for student ${student.studentCode} from ${eligibilityResult.currentLevel} to ${eligibilityResult.nextLevel}`);

      return {
        success: true,
        promotion,
        autoApproved: promotion.status === 'approved',
        message: promotion.status === 'approved' 
          ? `تم ترقية الطالب تلقائياً إلى المستوى ${eligibilityResult.nextLevel}`
          : `تم إنشاء طلب ترقية للمراجعة - مستوى ${eligibilityResult.nextLevel}`
      };

    } catch (error) {
      console.error('Error processing automatic promotion:', error);
      throw error;
    }
  }

  /**
   * Manual promotion approval by trainer
   */
  async approvePromotion(promotionId, trainerId, notes = '') {
    try {
      const promotion = await Promotion.findById(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }

      if (promotion.status !== 'pending') {
        throw new Error(`Promotion is already ${promotion.status}`);
      }

      // Update promotion status
      promotion.status = 'approved';
      promotion.approvedBy = trainerId;
      promotion.approvedAt = new Date();
      promotion.trainerNotes = notes;
      await promotion.save();

      // Execute the promotion
      await this.executePromotion(
        promotion.studentId,
        promotion.curriculum,
        promotion.toLevel,
        promotion._id
      );

      console.log(`Promotion ${promotionId} approved by trainer ${trainerId}`);

      return {
        success: true,
        promotion,
        message: `تم اعتماد الترقية إلى المستوى ${promotion.toLevel}`
      };

    } catch (error) {
      console.error('Error approving promotion:', error);
      throw error;
    }
  }

  /**
   * Reject promotion request
   */
  async rejectPromotion(promotionId, trainerId, reason) {
    try {
      const promotion = await Promotion.findById(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }

      if (promotion.status !== 'pending') {
        throw new Error(`Promotion is already ${promotion.status}`);
      }

      promotion.status = 'rejected';
      promotion.rejectedBy = trainerId;
      promotion.rejectedAt = new Date();
      promotion.rejectionReason = reason;
      await promotion.save();

      console.log(`Promotion ${promotionId} rejected by trainer ${trainerId}`);

      return {
        success: true,
        promotion,
        message: `تم رفض طلب الترقية: ${reason}`
      };

    } catch (error) {
      console.error('Error rejecting promotion:', error);
      throw error;
    }
  }

  /**
   * Get pending promotions for trainer review
   */
  async getPendingPromotions(trainerId = null, curriculum = null) {
    try {
      const query = { status: 'pending' };
      
      if (curriculum) {
        query.curriculum = curriculum;
      }

      const promotions = await Promotion.find(query)
        .populate('studentId', 'fullName studentCode profile')
        .sort({ createdAt: -1 });

      return promotions.map(promotion => ({
        id: promotion._id,
        student: {
          name: promotion.studentId.fullName,
          code: promotion.studentCode,
          ageGroup: promotion.studentId.profile?.ageGroup
        },
        curriculum: promotion.curriculum,
        fromLevel: promotion.fromLevel,
        toLevel: promotion.toLevel,
        confidence: promotion.confidence,
        performance: promotion.performance,
        createdAt: promotion.createdAt,
        sessionCount: promotion.sessionIds?.length || 0,
        waitingDays: Math.floor((new Date() - promotion.createdAt) / (1000 * 60 * 60 * 24))
      }));

    } catch (error) {
      console.error('Error getting pending promotions:', error);
      throw error;
    }
  }

  /**
   * Get promotion history for a student
   */
  async getPromotionHistory(studentId, curriculum = null) {
    try {
      const query = { studentId };
      if (curriculum) {
        query.curriculum = curriculum;
      }

      const promotions = await Promotion.find(query)
        .sort({ createdAt: -1 })
        .populate('approvedBy rejectedBy', 'fullName');

      return promotions.map(promotion => ({
        id: promotion._id,
        curriculum: promotion.curriculum,
        fromLevel: promotion.fromLevel,
        toLevel: promotion.toLevel,
        type: promotion.type,
        status: promotion.status,
        confidence: promotion.confidence,
        createdAt: promotion.createdAt,
        approvedAt: promotion.approvedAt,
        rejectedAt: promotion.rejectedAt,
        approvedBy: promotion.approvedBy?.fullName,
        rejectedBy: promotion.rejectedBy?.fullName,
        notes: promotion.notes,
        trainerNotes: promotion.trainerNotes,
        rejectionReason: promotion.rejectionReason
      }));

    } catch (error) {
      console.error('Error getting promotion history:', error);
      throw error;
    }
  }

  /**
   * Execute the actual promotion (update student level)
   */
  async executePromotion(studentId, curriculum, newLevel, promotionId) {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Update student's current level
      if (!student.currentLevel) {
        student.currentLevel = {};
      }
      
      const oldLevel = student.currentLevel[curriculum];
      student.currentLevel[curriculum] = newLevel;
      
      // Add to promotion history
      if (!student.promotionHistory) {
        student.promotionHistory = [];
      }
      
      student.promotionHistory.push({
        curriculum,
        fromLevel: oldLevel,
        toLevel: newLevel,
        promotionId,
        date: new Date()
      });

      await student.save();

      console.log(`Student ${student.studentCode} promoted from ${oldLevel} to ${newLevel} in ${curriculum}`);

      return {
        success: true,
        oldLevel,
        newLevel,
        student: {
          id: student._id,
          code: student.studentCode,
          name: student.fullName
        }
      };

    } catch (error) {
      console.error('Error executing promotion:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  getCriteriaForLevel(curriculum, level) {
    return this.promotionCriteria[curriculum]?.levels[level] || null;
  }

  async getRecentSessions(studentId, curriculum, level, limit = 10) {
    return await Session.find({
      studentId,
      curriculum,
      level
    })
    .sort({ createdAt: -1 })
    .limit(limit);
  }

  async analyzePerformanceForPromotion(sessions, criteria) {
    if (sessions.length === 0) {
      return null;
    }

    // Calculate averages
    const totalSessions = sessions.length;
    const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalSessions;
    const avgTime = sessions.reduce((sum, s) => sum + s.averageTimePerQuestion, 0) / totalSessions;
    
    // Calculate consistency (standard deviation of accuracy)
    const accuracyValues = sessions.map(s => s.accuracy);
    const accuracyStdDev = this.calculateStandardDeviation(accuracyValues);
    const consistencyScore = Math.max(0, 100 - (accuracyStdDev * 2));

    // Count successful sessions (meeting minimum criteria)
    const successfulSessions = sessions.filter(session => 
      session.accuracy >= criteria.minimumAccuracy && 
      session.averageTimePerQuestion <= criteria.maximumAverageTime
    ).length;

    // Calculate improvement trend
    const improvementTrend = this.calculateImprovementTrend(sessions);

    // Get recent consecutive successful sessions
    const recentSuccessful = this.countRecentSuccessfulSessions(sessions, criteria);

    return {
      totalSessions,
      avgAccuracy: Math.round(avgAccuracy * 100) / 100,
      avgTime: Math.round(avgTime * 100) / 100,
      consistencyScore: Math.round(consistencyScore * 100) / 100,
      successfulSessions,
      successRate: Math.round((successfulSessions / totalSessions) * 100),
      improvementTrend,
      recentSuccessful,
      sessionDetails: sessions.map(s => ({
        id: s._id,
        accuracy: s.accuracy,
        time: s.averageTimePerQuestion,
        result: s.result,
        date: s.createdAt
      }))
    };
  }

  evaluatePromotionCriteria(performance, criteria) {
    const evaluation = {
      eligible: true,
      reasons: [],
      scores: {}
    };

    // Check accuracy
    if (performance.avgAccuracy >= criteria.minimumAccuracy) {
      evaluation.scores.accuracy = { met: true, score: performance.avgAccuracy, required: criteria.minimumAccuracy };
    } else {
      evaluation.eligible = false;
      evaluation.reasons.push(`الدقة ${performance.avgAccuracy}% أقل من المطلوب ${criteria.minimumAccuracy}%`);
      evaluation.scores.accuracy = { met: false, score: performance.avgAccuracy, required: criteria.minimumAccuracy };
    }

    // Check speed
    if (performance.avgTime <= criteria.maximumAverageTime) {
      evaluation.scores.speed = { met: true, score: performance.avgTime, required: criteria.maximumAverageTime };
    } else {
      evaluation.eligible = false;
      evaluation.reasons.push(`متوسط الوقت ${performance.avgTime}ث أكبر من المطلوب ${criteria.maximumAverageTime}ث`);
      evaluation.scores.speed = { met: false, score: performance.avgTime, required: criteria.maximumAverageTime };
    }

    // Check consistency
    if (performance.consistencyScore >= criteria.consistencyThreshold) {
      evaluation.scores.consistency = { met: true, score: performance.consistencyScore, required: criteria.consistencyThreshold };
    } else {
      evaluation.eligible = false;
      evaluation.reasons.push(`الثبات ${performance.consistencyScore}% أقل من المطلوب ${criteria.consistencyThreshold}%`);
      evaluation.scores.consistency = { met: false, score: performance.consistencyScore, required: criteria.consistencyThreshold };
    }

    // Check successful sessions
    if (performance.recentSuccessful >= criteria.requiredSuccessfulSessions) {
      evaluation.scores.successfulSessions = { met: true, score: performance.recentSuccessful, required: criteria.requiredSuccessfulSessions };
    } else {
      evaluation.eligible = false;
      evaluation.reasons.push(`${performance.recentSuccessful} جلسات ناجحة من أصل ${criteria.requiredSuccessfulSessions} مطلوبة`);
      evaluation.scores.successfulSessions = { met: false, score: performance.recentSuccessful, required: criteria.requiredSuccessfulSessions };
    }

    return evaluation;
  }

  calculatePromotionConfidence(performance, criteria) {
    let confidence = 0;

    // Accuracy component (35%)
    const accuracyRatio = Math.min(performance.avgAccuracy / criteria.minimumAccuracy, 1.2);
    confidence += accuracyRatio * this.promotionWeights.accuracy * 100;

    // Speed component (25%)
    const speedRatio = Math.min(criteria.maximumAverageTime / performance.avgTime, 1.2);
    confidence += speedRatio * this.promotionWeights.speed * 100;

    // Consistency component (20%)
    const consistencyRatio = Math.min(performance.consistencyScore / criteria.consistencyThreshold, 1.2);
    confidence += consistencyRatio * this.promotionWeights.consistency * 100;

    // Improvement component (15%)
    const improvementScore = Math.max(0, Math.min(performance.improvementTrend, 1));
    confidence += improvementScore * this.promotionWeights.improvement * 100;

    // Session count component (5%)
    const sessionRatio = Math.min(performance.totalSessions / criteria.minimumSessionsAtLevel, 1.2);
    confidence += sessionRatio * this.promotionWeights.sessionCount * 100;

    return Math.min(Math.round(confidence), 100);
  }

  getNextLevel(curriculum, currentLevel) {
    const progression = this.levelProgression[curriculum];
    if (!progression) return null;

    const currentIndex = progression.indexOf(currentLevel);
    if (currentIndex === -1 || currentIndex === progression.length - 1) {
      return null; // Already at highest level or level not found
    }

    return progression[currentIndex + 1];
  }

  generatePromotionRecommendation(evaluation, confidence) {
    if (evaluation.eligible && confidence >= 90) {
      return 'ترقية فورية - أداء ممتاز';
    } else if (evaluation.eligible && confidence >= 75) {
      return 'ترقية مع المراجعة - أداء جيد';
    } else if (evaluation.eligible) {
      return 'ترقية مع متابعة إضافية';
    } else {
      return `يحتاج تحسين: ${evaluation.reasons.join(', ')}`;
    }
  }

  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  calculateImprovementTrend(sessions) {
    if (sessions.length < 3) return 0;

    // Compare first half with second half
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(midPoint);
    const secondHalf = sessions.slice(0, midPoint);

    const firstAvgAccuracy = firstHalf.reduce((sum, s) => sum + s.accuracy, 0) / firstHalf.length;
    const secondAvgAccuracy = secondHalf.reduce((sum, s) => sum + s.accuracy, 0) / secondHalf.length;

    const improvement = (secondAvgAccuracy - firstAvgAccuracy) / 100;
    return Math.max(-1, Math.min(1, improvement));
  }

  countRecentSuccessfulSessions(sessions, criteria) {
    let count = 0;
    for (const session of sessions) {
      if (session.accuracy >= criteria.minimumAccuracy && 
          session.averageTimePerQuestion <= criteria.maximumAverageTime) {
        count++;
      } else {
        break; // Stop at first unsuccessful session
      }
    }
    return count;
  }

  async updateAdaptiveDataForPromotion(studentId, curriculum, promotion) {
    try {
      let adaptiveData = await AdaptiveData.findOne({ studentId, curriculum });
      
      if (adaptiveData) {
        // Add promotion event to history
        adaptiveData.adjustmentHistory.push({
          type: 'promotion',
          fromLevel: promotion.fromLevel,
          toLevel: promotion.toLevel,
          confidence: promotion.confidence,
          timestamp: new Date(),
          details: {
            promotionId: promotion._id,
            type: promotion.type,
            performance: promotion.performance
          }
        });

        // Update predictions for new level
        await adaptiveData.updatePredictions();
        await adaptiveData.save();
      }
    } catch (error) {
      console.error('Error updating adaptive data for promotion:', error);
    }
  }

  /**
   * Get promotion statistics for reporting
   */
  async getPromotionStatistics(timeRange = 30, curriculum = null) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);

      const query = { createdAt: { $gte: startDate } };
      if (curriculum) {
        query.curriculum = curriculum;
      }

      const promotions = await Promotion.find(query);

      const stats = {
        total: promotions.length,
        approved: promotions.filter(p => p.status === 'approved').length,
        pending: promotions.filter(p => p.status === 'pending').length,
        rejected: promotions.filter(p => p.status === 'rejected').length,
        automatic: promotions.filter(p => p.type === 'automatic').length,
        manual: promotions.filter(p => p.type === 'manual').length,
        averageConfidence: promotions.length > 0 ? 
          promotions.reduce((sum, p) => sum + (p.confidence || 0), 0) / promotions.length : 0,
        byCurriculum: {},
        byLevel: {}
      };

      // Group by curriculum
      promotions.forEach(promotion => {
        const curr = promotion.curriculum;
        if (!stats.byCurriculum[curr]) {
          stats.byCurriculum[curr] = { total: 0, approved: 0, pending: 0, rejected: 0 };
        }
        stats.byCurriculum[curr].total++;
        stats.byCurriculum[curr][promotion.status]++;
      });

      // Group by level
      promotions.forEach(promotion => {
        const level = `${promotion.fromLevel} → ${promotion.toLevel}`;
        if (!stats.byLevel[level]) {
          stats.byLevel[level] = { total: 0, approved: 0, pending: 0, rejected: 0 };
        }
        stats.byLevel[level].total++;
        stats.byLevel[level][promotion.status]++;
      });

      return stats;

    } catch (error) {
      console.error('Error getting promotion statistics:', error);
      throw error;
    }
  }
}

module.exports = PromotionSystem;
