/**
 * Adaptive Session Controller for ICSHD GENIUSES
 * Handles adaptive session management and real-time adjustments
 */

const PersonalizationService = require('../services/PersonalizationService');
const AdaptiveLearningEngine = require('../adaptive/AdaptiveLearningEngine');
const Session = require('../models/Session');
const User = require('../models/User');
const AdaptiveData = require('../models/AdaptiveData');

class AdaptiveSessionController {
  constructor(io) {
    this.io = io;
    this.personalizationService = new PersonalizationService();
    this.adaptiveEngine = new AdaptiveLearningEngine();
    
    // Track active adaptive sessions
    this.activeSessions = new Map();
    
    // Real-time adaptation settings
    this.adaptationSettings = {
      minResponsesForAdaptation: 3,
      adaptationCooldown: 5, // minutes
      maxAdaptationsPerSession: 3
    };
  }

  /**
   * Create adaptive session with personalization
   */
  async createAdaptiveSession(req, res) {
    try {
      const { studentId } = req.params;
      const sessionConfig = req.body;

      // Validate student exists
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Create personalized session configuration
      const personalizedSession = await this.personalizationService.createPersonalizedSession(
        studentId,
        sessionConfig
      );

      // Create session record
      const session = new Session({
        student: studentId,
        curriculum: sessionConfig.curriculum,
        level: sessionConfig.requestedLevel,
        targetDifficulty: personalizedSession.sessionConfig.targetDifficulty,
        exercises: personalizedSession.exercises.map(exercise => ({
          exercise: exercise._id || exercise,
          question: exercise.question,
          answer: exercise.answer,
          difficulty: exercise.difficulty,
          timeLimit: exercise.timeLimit,
          type: exercise.type,
          metadata: exercise.metadata
        })),
        sessionPlan: personalizedSession.sessionPlan,
        personalizationReasoning: personalizedSession.personalizationReasoning,
        adaptiveFeatures: personalizedSession.sessionConfig.adaptiveFeatures,
        status: 'created',
        createdAt: new Date()
      });

      await session.save();

      // Track session for real-time adaptation
      this.activeSessions.set(session._id.toString(), {
        sessionId: session._id,
        studentId,
        currentExerciseIndex: 0,
        recentResponses: [],
        adaptationCount: 0,
        lastAdaptation: null,
        startTime: new Date()
      });

      // Emit session created event
      this.io.to(`student_${studentId}`).emit('adaptiveSessionCreated', {
        sessionId: session._id,
        personalization: personalizedSession.personalizationReasoning,
        estimatedDuration: personalizedSession.sessionPlan.estimatedDuration
      });

      res.status(201).json({
        success: true,
        data: {
          sessionId: session._id,
          exercises: personalizedSession.exercises,
          sessionPlan: personalizedSession.sessionPlan,
          personalization: personalizedSession.personalizationReasoning
        }
      });
    } catch (error) {
      console.error('Error creating adaptive session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create adaptive session',
        error: error.message
      });
    }
  }

  /**
   * Submit answer with real-time adaptation
   */
  async submitAnswerWithAdaptation(req, res) {
    try {
      const { sessionId, exerciseIndex } = req.params;
      const { answer, timeSpent, skipped = false } = req.body;

      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Get active session tracking
      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        return res.status(400).json({
          success: false,
          message: 'Session not actively tracked'
        });
      }

      // Process the answer
      const exercise = session.exercises[exerciseIndex];
      const isCorrect = !skipped && this.checkAnswer(answer, exercise.answer);
      
      // Update exercise result
      session.exercises[exerciseIndex] = {
        ...exercise,
        studentAnswer: answer,
        isCorrect,
        timeSpent,
        skipped,
        submittedAt: new Date()
      };

      // Update active session tracking
      activeSession.currentExerciseIndex = parseInt(exerciseIndex);
      activeSession.recentResponses.push({
        exerciseIndex: parseInt(exerciseIndex),
        isCorrect,
        timeSpent,
        skipped,
        difficulty: exercise.difficulty
      });

      // Keep only recent responses for adaptation
      if (activeSession.recentResponses.length > 5) {
        activeSession.recentResponses = activeSession.recentResponses.slice(-5);
      }

      // Check if real-time adaptation is needed
      let adaptationResult = { adapted: false };
      if (this.shouldCheckForAdaptation(activeSession, exerciseIndex)) {
        adaptationResult = await this.checkAndApplyAdaptation(session, activeSession);
      }

      // Save session
      await session.save();

      // Emit real-time updates
      this.io.to(`student_${session.student}`).emit('exerciseSubmitted', {
        sessionId,
        exerciseIndex,
        isCorrect,
        timeSpent,
        adaptation: adaptationResult
      });

      // Emit to trainers monitoring this student
      this.io.to(`trainer_monitoring_${session.student}`).emit('studentProgress', {
        studentId: session.student,
        sessionId,
        exerciseIndex,
        isCorrect,
        currentAccuracy: this.calculateCurrentAccuracy(session.exercises.slice(0, exerciseIndex + 1))
      });

      res.json({
        success: true,
        data: {
          isCorrect,
          correctAnswer: exercise.answer,
          explanation: exercise.explanation,
          nextExercise: session.exercises[exerciseIndex + 1] || null,
          adaptation: adaptationResult,
          progress: {
            completed: exerciseIndex + 1,
            total: session.exercises.length,
            accuracy: this.calculateCurrentAccuracy(session.exercises.slice(0, exerciseIndex + 1))
          }
        }
      });
    } catch (error) {
      console.error('Error submitting answer with adaptation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to submit answer',
        error: error.message
      });
    }
  }

  /**
   * Get adaptive recommendations for next exercise
   */
  async getAdaptiveRecommendations(req, res) {
    try {
      const { sessionId, exerciseIndex } = req.params;

      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        return res.status(400).json({
          success: false,
          message: 'Session not actively tracked'
        });
      }

      // Analyze current performance
      const completedExercises = session.exercises.slice(0, exerciseIndex);
      const currentMetrics = this.calculateSessionMetrics(completedExercises);

      // Get adaptive data
      const adaptiveData = await this.adaptiveEngine.getAdaptiveData(
        session.student,
        session.curriculum
      );

      // Generate recommendations
      const recommendations = await this.generateCurrentRecommendations(
        currentMetrics,
        adaptiveData,
        session
      );

      res.json({
        success: true,
        data: {
          currentMetrics,
          recommendations,
          adaptiveInsights: this.getAdaptiveInsights(currentMetrics, adaptiveData)
        }
      });
    } catch (error) {
      console.error('Error getting adaptive recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: error.message
      });
    }
  }

  /**
   * Complete adaptive session with analysis
   */
  async completeAdaptiveSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Perform comprehensive analysis
      const analysisResult = await this.adaptiveEngine.analyzePerformance(
        session.student,
        sessionId
      );

      // Update session with final analysis
      session.status = 'completed';
      session.completedAt = new Date();
      session.finalAnalysis = analysisResult;
      session.totalTime = this.calculateTotalTime(session.exercises);
      session.accuracy = this.calculateCurrentAccuracy(session.exercises);

      await session.save();

      // Generate session summary
      const sessionSummary = await this.generateSessionSummary(session, analysisResult);

      // Emit completion events
      this.io.to(`student_${session.student}`).emit('adaptiveSessionCompleted', {
        sessionId,
        summary: sessionSummary,
        analysis: analysisResult
      });

      res.json({
        success: true,
        data: {
          sessionSummary,
          analysis: analysisResult,
          nextRecommendations: analysisResult.recommendations
        }
      });
    } catch (error) {
      console.error('Error completing adaptive session:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete session',
        error: error.message
      });
    }
  }

  /**
   * Get adaptive session analytics
   */
  async getSessionAnalytics(req, res) {
    try {
      const { studentId } = req.params;
      const { timeRange = 'month', curriculum } = req.query;

      // Get adaptive data
      const adaptiveData = await AdaptiveData.find({
        studentId,
        ...(curriculum && { curriculum })
      });

      // Get recent sessions
      const sessions = await Session.find({
        student: studentId,
        status: 'completed',
        ...(curriculum && { curriculum }),
        createdAt: {
          $gte: this.getTimeRangeStart(timeRange)
        }
      }).sort({ createdAt: -1 });

      // Calculate analytics
      const analytics = this.calculateAdaptiveAnalytics(sessions, adaptiveData);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting session analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get analytics',
        error: error.message
      });
    }
  }

  /**
   * Force adaptation during session (for testing/manual adjustment)
   */
  async forceAdaptation(req, res) {
    try {
      const { sessionId } = req.params;
      const { adaptationType, parameters } = req.body;

      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      const activeSession = this.activeSessions.get(sessionId);
      if (!activeSession) {
        return res.status(400).json({
          success: false,
          message: 'Session not actively tracked'
        });
      }

      // Apply forced adaptation
      const adaptationResult = await this.applyForcedAdaptation(
        session,
        activeSession,
        adaptationType,
        parameters
      );

      await session.save();

      // Emit adaptation event
      this.io.to(`student_${session.student}`).emit('sessionAdapted', {
        sessionId,
        adaptation: adaptationResult,
        forced: true
      });

      res.json({
        success: true,
        data: adaptationResult
      });
    } catch (error) {
      console.error('Error forcing adaptation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to force adaptation',
        error: error.message
      });
    }
  }

  /**
   * Helper methods
   */
  shouldCheckForAdaptation(activeSession, exerciseIndex) {
    // Check minimum responses
    if (activeSession.recentResponses.length < this.adaptationSettings.minResponsesForAdaptation) {
      return false;
    }

    // Check adaptation cooldown
    if (activeSession.lastAdaptation) {
      const timeSinceLastAdaptation = Date.now() - activeSession.lastAdaptation.getTime();
      if (timeSinceLastAdaptation < this.adaptationSettings.adaptationCooldown * 60 * 1000) {
        return false;
      }
    }

    // Check max adaptations
    if (activeSession.adaptationCount >= this.adaptationSettings.maxAdaptationsPerSession) {
      return false;
    }

    // Check if at adaptation breakpoint
    const totalExercises = activeSession.recentResponses.length;
    return exerciseIndex > 0 && (exerciseIndex + 1) % 5 === 0; // Every 5 exercises
  }

  async checkAndApplyAdaptation(session, activeSession) {
    try {
      const adaptationResult = await this.personalizationService.adaptSessionInRealTime(
        session._id,
        activeSession.currentExerciseIndex,
        activeSession.recentResponses
      );

      if (adaptationResult.adapted) {
        activeSession.adaptationCount++;
        activeSession.lastAdaptation = new Date();

        // Emit real-time adaptation notification
        this.io.to(`student_${session.student}`).emit('sessionAdapted', {
          sessionId: session._id,
          adaptation: adaptationResult,
          exerciseIndex: activeSession.currentExerciseIndex
        });
      }

      return adaptationResult;
    } catch (error) {
      console.error('Error checking and applying adaptation:', error);
      return { adapted: false, error: error.message };
    }
  }

  checkAnswer(studentAnswer, correctAnswer) {
    // Normalize answers for comparison
    const normalize = (answer) => {
      return String(answer).trim().toLowerCase().replace(/\s+/g, '');
    };

    return normalize(studentAnswer) === normalize(correctAnswer);
  }

  calculateCurrentAccuracy(exercises) {
    const completed = exercises.filter(ex => ex.submittedAt);
    if (completed.length === 0) return 0;
    
    const correct = completed.filter(ex => ex.isCorrect && !ex.skipped).length;
    return Math.round((correct / completed.length) * 100);
  }

  calculateTotalTime(exercises) {
    return exercises.reduce((total, ex) => total + (ex.timeSpent || 0), 0);
  }

  calculateSessionMetrics(exercises) {
    const completed = exercises.filter(ex => ex.submittedAt);
    
    if (completed.length === 0) {
      return {
        accuracy: 0,
        averageTime: 0,
        totalTime: 0,
        completed: 0,
        skipped: 0
      };
    }

    const correct = completed.filter(ex => ex.isCorrect && !ex.skipped).length;
    const skipped = completed.filter(ex => ex.skipped).length;
    const totalTime = completed.reduce((sum, ex) => sum + (ex.timeSpent || 0), 0);

    return {
      accuracy: (correct / completed.length) * 100,
      averageTime: totalTime / completed.length,
      totalTime,
      completed: completed.length,
      skipped,
      correct
    };
  }

  async generateCurrentRecommendations(currentMetrics, adaptiveData, session) {
    const recommendations = [];

    // Performance-based recommendations
    if (currentMetrics.accuracy < 60) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: 'ركز على الدقة أكثر من السرعة',
        suggestion: 'خذ وقتاً أطول للتفكير في كل إجابة'
      });
    }

    if (currentMetrics.averageTime > 60) {
      recommendations.push({
        type: 'speed',
        priority: 'medium',
        message: 'حاول تحسين سرعة الإجابة',
        suggestion: 'مارس التمارين الأساسية لتحسين السرعة'
      });
    }

    // Adaptive recommendations
    if (adaptiveData.weaknessAreas && adaptiveData.weaknessAreas.length > 0) {
      recommendations.push({
        type: 'weakness',
        priority: 'high',
        message: `ركز على تحسين: ${adaptiveData.weaknessAreas[0]}`,
        suggestion: 'ستحصل على تمارين إضافية في هذا المجال'
      });
    }

    return recommendations;
  }

  getAdaptiveInsights(currentMetrics, adaptiveData) {
    return {
      learningStyle: adaptiveData.learningStyle,
      difficultyLevel: Math.round(adaptiveData.difficultyScore * 100),
      strongAreas: adaptiveData.strengthAreas || [],
      improvementAreas: adaptiveData.weaknessAreas || [],
      sessionProgress: {
        currentAccuracy: currentMetrics.accuracy,
        targetAccuracy: 75,
        improvementTrend: currentMetrics.accuracy > adaptiveData.averageAccuracy ? 'improving' : 'stable'
      }
    };
  }

  async generateSessionSummary(session, analysisResult) {
    const metrics = this.calculateSessionMetrics(session.exercises);
    
    return {
      sessionId: session._id,
      curriculum: session.curriculum,
      level: session.level,
      duration: Math.round(metrics.totalTime / 60), // in minutes
      performance: {
        accuracy: metrics.accuracy,
        totalQuestions: session.exercises.length,
        correctAnswers: metrics.correct,
        averageTime: Math.round(metrics.averageTime)
      },
      adaptations: session.adaptationHistory || [],
      achievements: analysisResult.achievements || [],
      nextSteps: analysisResult.recommendations || []
    };
  }

  calculateAdaptiveAnalytics(sessions, adaptiveData) {
    return {
      totalSessions: sessions.length,
      averageAccuracy: sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length,
      improvementTrend: this.calculateImprovementTrend(sessions),
      adaptiveProgress: adaptiveData.map(data => ({
        curriculum: data.curriculum,
        currentLevel: data.currentLevel,
        difficultyScore: data.difficultyScore,
        learningStyle: data.learningStyle
      })),
      recentPerformance: sessions.slice(0, 10).map(s => ({
        date: s.createdAt,
        accuracy: s.accuracy,
        duration: s.totalTime
      }))
    };
  }

  calculateImprovementTrend(sessions) {
    if (sessions.length < 2) return 'insufficient_data';
    
    const recent = sessions.slice(0, Math.ceil(sessions.length / 2));
    const older = sessions.slice(Math.ceil(sessions.length / 2));
    
    const recentAvg = recent.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, s) => sum + (s.accuracy || 0), 0) / older.length;
    
    const improvement = recentAvg - olderAvg;
    
    if (improvement > 5) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  }

  getTimeRangeStart(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case 'year':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  async applyForcedAdaptation(session, activeSession, adaptationType, parameters) {
    // Implementation for forced adaptation
    const adaptation = {
      type: adaptationType,
      parameters,
      appliedAt: new Date(),
      forced: true
    };

    // Apply the adaptation based on type
    switch (adaptationType) {
      case 'difficulty':
        // Adjust difficulty of remaining exercises
        break;
      case 'time':
        // Adjust time limits
        break;
      case 'focus':
        // Change exercise focus areas
        break;
    }

    return adaptation;
  }
}

module.exports = AdaptiveSessionController;
