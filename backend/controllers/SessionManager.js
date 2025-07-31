/**
 * Session Manager for ICSHD GENIUSES
 * Handles session creation, management, and real-time updates
 */

const Session = require('../models/Session');
const User = require('../models/User');
const AdaptiveData = require('../models/AdaptiveData');
const MainGenerator = require('../generators/MainGenerator');
const AssessmentEngine = require('../assessment/AssessmentEngine');
const PromotionSystem = require('../assessment/PromotionSystem');

class SessionManager {
  constructor(io) {
    this.io = io; // Socket.io instance for real-time updates
    this.activeSessions = new Map(); // Track active sessions
    this.mainGenerator = new MainGenerator();
    this.assessmentEngine = new AssessmentEngine();
    this.promotionSystem = new PromotionSystem();
    
    // Session timeouts (in minutes)
    this.sessionTimeouts = {
      soroban: 30,
      vedic: 45,
      logic: 60,
      iqgames: 40
    };

    // Auto-save intervals (in seconds)
    this.autoSaveInterval = 30;
    
    this.setupSocketHandlers();
  }

  /**
   * Create a new training session
   */
  async createSession(sessionConfig) {
    try {
      const {
        studentId,
        trainerId,
        curriculum,
        level,
        ageGroup,
        sessionType = 'practice',
        customSettings = {},
        duration = null
      } = sessionConfig;

      // Validate student and trainer
      const student = await User.findById(studentId);
      const trainer = trainerId ? await User.findById(trainerId) : null;

      if (!student) {
        throw new Error('Student not found');
      }

      // Generate session ID
      const sessionId = this.generateSessionId();

      // Get adaptive data for personalization
      const adaptiveData = await AdaptiveData.findOne({
        studentId,
        curriculum
      });

      // Generate exercises using MainGenerator
      const exerciseConfig = {
        curriculum,
        level,
        ageGroup,
        sessionType,
        adaptiveData,
        customSettings
      };

      const generatedExercises = await this.mainGenerator.generateSession(exerciseConfig);

      // Create session document
      const sessionData = {
        sessionId,
        studentId,
        trainerId,
        studentCode: student.studentCode,
        curriculum,
        level,
        ageGroup,
        sessionType,
        status: 'active',
        exercises: generatedExercises.exercises.map(exercise => ({
          ...exercise,
          isAnswered: false,
          isCorrect: null,
          studentAnswer: null,
          timeSpent: 0,
          hintsUsed: 0,
          attempts: 0
        })),
        totalQuestions: generatedExercises.exercises.length,
        currentQuestionIndex: 0,
        startTime: new Date(),
        duration: duration || this.sessionTimeouts[curriculum] * 60, // Convert to seconds
        settings: {
          ...generatedExercises.settings,
          ...customSettings,
          autoSave: true,
          allowHints: customSettings.allowHints !== false,
          allowSkip: customSettings.allowSkip !== false,
          showProgress: customSettings.showProgress !== false
        },
        metadata: {
          generatorVersion: generatedExercises.metadata.version,
          adaptiveAdjustments: generatedExercises.metadata.adaptiveAdjustments,
          difficulty: generatedExercises.metadata.difficulty,
          estimatedDuration: generatedExercises.metadata.estimatedDuration
        }
      };

      const session = await Session.create(sessionData);

      // Track active session
      this.activeSessions.set(sessionId, {
        session,
        startTime: Date.now(),
        lastActivity: Date.now(),
        autoSaveTimer: null,
        timeoutTimer: null
      });

      // Setup auto-save and timeout
      this.setupSessionTimers(sessionId);

      // Emit session created event
      if (this.io) {
        this.io.to(`student_${studentId}`).emit('sessionCreated', {
          sessionId,
          totalQuestions: session.totalQuestions,
          duration: session.duration,
          settings: session.settings
        });

        if (trainerId) {
          this.io.to(`trainer_${trainerId}`).emit('studentSessionStarted', {
            sessionId,
            studentCode: student.studentCode,
            curriculum,
            level
          });
        }
      }

      console.log(`Session ${sessionId} created for student ${student.studentCode}`);

      return {
        success: true,
        sessionId,
        session: {
          id: session._id,
          sessionId,
          curriculum,
          level,
          totalQuestions: session.totalQuestions,
          duration: session.duration,
          settings: session.settings,
          firstExercise: session.exercises[0] || null
        }
      };

    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get current exercise for student
   */
  async getCurrentExercise(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      const currentIndex = session.currentQuestionIndex;
      
      if (currentIndex >= session.exercises.length) {
        return {
          completed: true,
          message: 'تم إنهاء جميع التمارين'
        };
      }

      const currentExercise = session.exercises[currentIndex];
      
      // Update last activity
      sessionData.lastActivity = Date.now();

      // Emit exercise viewed event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('exerciseViewed', {
          sessionId,
          exerciseIndex: currentIndex,
          totalQuestions: session.totalQuestions
        });
      }

      return {
        exercise: {
          index: currentIndex,
          total: session.totalQuestions,
          question: currentExercise.question,
          type: currentExercise.exerciseType,
          difficulty: currentExercise.difficulty,
          hints: currentExercise.hints || [],
          allowHints: session.settings.allowHints,
          allowSkip: session.settings.allowSkip,
          timeLimit: currentExercise.timeLimit,
          metadata: currentExercise.metadata
        },
        progress: {
          current: currentIndex + 1,
          total: session.totalQuestions,
          percentage: Math.round(((currentIndex) / session.totalQuestions) * 100)
        },
        session: {
          timeRemaining: this.calculateTimeRemaining(session),
          settings: session.settings
        }
      };

    } catch (error) {
      console.error('Error getting current exercise:', error);
      throw error;
    }
  }

  /**
   * Submit answer for current exercise
   */
  async submitAnswer(sessionId, answer, timeSpent = 0) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      const currentIndex = session.currentQuestionIndex;
      
      if (currentIndex >= session.exercises.length) {
        throw new Error('No more exercises available');
      }

      const exercise = session.exercises[currentIndex];
      
      // Validate and evaluate answer
      const isCorrect = this.validateAnswer(exercise, answer);
      
      // Update exercise data
      exercise.isAnswered = true;
      exercise.isCorrect = isCorrect;
      exercise.studentAnswer = answer;
      exercise.timeSpent = timeSpent;
      exercise.attempts = (exercise.attempts || 0) + 1;
      exercise.answeredAt = new Date();

      // Update session statistics
      if (isCorrect) {
        session.correctAnswers = (session.correctAnswers || 0) + 1;
      } else {
        session.incorrectAnswers = (session.incorrectAnswers || 0) + 1;
      }

      // Calculate current accuracy
      const answeredQuestions = session.correctAnswers + session.incorrectAnswers;
      session.accuracy = answeredQuestions > 0 ? (session.correctAnswers / answeredQuestions) * 100 : 0;

      // Update average time
      const totalTime = session.exercises
        .slice(0, currentIndex + 1)
        .reduce((sum, ex) => sum + (ex.timeSpent || 0), 0);
      session.averageTimePerQuestion = answeredQuestions > 0 ? totalTime / answeredQuestions : 0;

      // Move to next question
      session.currentQuestionIndex = currentIndex + 1;
      
      // Update last activity
      sessionData.lastActivity = Date.now();

      // Check if session is complete
      const isComplete = session.currentQuestionIndex >= session.exercises.length;
      
      let result = {
        correct: isCorrect,
        correctAnswer: exercise.correctAnswer,
        explanation: exercise.explanation,
        nextAvailable: !isComplete,
        sessionComplete: isComplete
      };

      if (isComplete) {
        result.sessionSummary = await this.completeSession(sessionId);
      }

      // Emit answer submitted event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('answerSubmitted', {
          sessionId,
          exerciseIndex: currentIndex,
          correct: isCorrect,
          accuracy: session.accuracy,
          progress: {
            current: session.currentQuestionIndex,
            total: session.totalQuestions,
            percentage: Math.round((session.currentQuestionIndex / session.totalQuestions) * 100)
          }
        });

        if (session.trainerId) {
          this.io.to(`trainer_${session.trainerId}`).emit('studentProgress', {
            sessionId,
            studentCode: session.studentCode,
            exerciseIndex: currentIndex,
            correct: isCorrect,
            accuracy: session.accuracy,
            timeSpent
          });
        }
      }

      // Auto-save session
      await this.saveSession(sessionId);

      return result;

    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }

  /**
   * Skip current exercise
   */
  async skipExercise(sessionId, reason = 'student_choice') {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      
      if (!session.settings.allowSkip) {
        throw new Error('Skipping is not allowed in this session');
      }

      const currentIndex = session.currentQuestionIndex;
      
      if (currentIndex >= session.exercises.length) {
        throw new Error('No more exercises available');
      }

      const exercise = session.exercises[currentIndex];
      
      // Mark as skipped
      exercise.isAnswered = false;
      exercise.isSkipped = true;
      exercise.skipReason = reason;
      exercise.skippedAt = new Date();

      // Update session statistics
      session.skippedQuestions = (session.skippedQuestions || 0) + 1;
      session.currentQuestionIndex = currentIndex + 1;

      // Update last activity
      sessionData.lastActivity = Date.now();

      // Check if session is complete
      const isComplete = session.currentQuestionIndex >= session.exercises.length;
      
      let result = {
        skipped: true,
        nextAvailable: !isComplete,
        sessionComplete: isComplete
      };

      if (isComplete) {
        result.sessionSummary = await this.completeSession(sessionId);
      }

      // Emit exercise skipped event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('exerciseSkipped', {
          sessionId,
          exerciseIndex: currentIndex,
          reason,
          progress: {
            current: session.currentQuestionIndex,
            total: session.totalQuestions,
            percentage: Math.round((session.currentQuestionIndex / session.totalQuestions) * 100)
          }
        });
      }

      await this.saveSession(sessionId);

      return result;

    } catch (error) {
      console.error('Error skipping exercise:', error);
      throw error;
    }
  }

  /**
   * Request hint for current exercise
   */
  async requestHint(sessionId, hintIndex = 0) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      
      if (!session.settings.allowHints) {
        throw new Error('Hints are not allowed in this session');
      }

      const currentIndex = session.currentQuestionIndex;
      const exercise = session.exercises[currentIndex];
      
      if (!exercise || !exercise.hints || exercise.hints.length === 0) {
        throw new Error('No hints available for this exercise');
      }

      if (hintIndex >= exercise.hints.length) {
        throw new Error('Hint index out of range');
      }

      // Track hint usage
      exercise.hintsUsed = (exercise.hintsUsed || 0) + 1;
      exercise.lastHintUsed = hintIndex;
      exercise.hintUsageLog = exercise.hintUsageLog || [];
      exercise.hintUsageLog.push({
        hintIndex,
        timestamp: new Date()
      });

      // Update last activity
      sessionData.lastActivity = Date.now();

      const hint = exercise.hints[hintIndex];

      // Emit hint requested event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('hintProvided', {
          sessionId,
          exerciseIndex: currentIndex,
          hintIndex,
          hint,
          hintsUsed: exercise.hintsUsed,
          totalHints: exercise.hints.length
        });
      }

      return {
        hint,
        hintIndex,
        hintsUsed: exercise.hintsUsed,
        totalHints: exercise.hints.length,
        moreHintsAvailable: hintIndex < exercise.hints.length - 1
      };

    } catch (error) {
      console.error('Error requesting hint:', error);
      throw error;
    }
  }

  /**
   * Pause session
   */
  async pauseSession(sessionId, reason = 'student_request') {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      
      if (session.status === 'paused') {
        throw new Error('Session is already paused');
      }

      session.status = 'paused';
      session.pausedAt = new Date();
      session.pauseReason = reason;

      // Clear timers
      this.clearSessionTimers(sessionId);

      // Emit session paused event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('sessionPaused', {
          sessionId,
          reason,
          pausedAt: session.pausedAt
        });

        if (session.trainerId) {
          this.io.to(`trainer_${session.trainerId}`).emit('studentSessionPaused', {
            sessionId,
            studentCode: session.studentCode,
            reason
          });
        }
      }

      await this.saveSession(sessionId);

      return {
        success: true,
        status: 'paused',
        pausedAt: session.pausedAt
      };

    } catch (error) {
      console.error('Error pausing session:', error);
      throw error;
    }
  }

  /**
   * Resume session
   */
  async resumeSession(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      
      if (session.status !== 'paused') {
        throw new Error('Session is not paused');
      }

      session.status = 'active';
      session.resumedAt = new Date();
      
      // Calculate pause duration and adjust session duration
      if (session.pausedAt) {
        const pauseDuration = (Date.now() - new Date(session.pausedAt).getTime()) / 1000;
        session.totalPauseDuration = (session.totalPauseDuration || 0) + pauseDuration;
      }

      // Restart timers
      this.setupSessionTimers(sessionId);

      // Update last activity
      sessionData.lastActivity = Date.now();

      // Emit session resumed event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('sessionResumed', {
          sessionId,
          resumedAt: session.resumedAt,
          timeRemaining: this.calculateTimeRemaining(session)
        });

        if (session.trainerId) {
          this.io.to(`trainer_${session.trainerId}`).emit('studentSessionResumed', {
            sessionId,
            studentCode: session.studentCode
          });
        }
      }

      await this.saveSession(sessionId);

      return {
        success: true,
        status: 'active',
        resumedAt: session.resumedAt,
        timeRemaining: this.calculateTimeRemaining(session)
      };

    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  }

  /**
   * Complete session and generate analysis
   */
  async completeSession(sessionId, reason = 'completed') {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        throw new Error('Session not found or inactive');
      }

      const session = sessionData.session;
      
      // Update session completion data
      session.status = 'completed';
      session.endTime = new Date();
      session.completionReason = reason;
      session.actualDuration = Math.floor((Date.now() - sessionData.startTime) / 1000);

      // Calculate final statistics
      const totalAnswered = session.correctAnswers + session.incorrectAnswers;
      session.accuracy = totalAnswered > 0 ? (session.correctAnswers / totalAnswered) * 100 : 0;
      session.completionRate = (totalAnswered / session.totalQuestions) * 100;

      // Calculate total time spent on exercises
      const totalExerciseTime = session.exercises.reduce((sum, ex) => sum + (ex.timeSpent || 0), 0);
      session.averageTimePerQuestion = totalAnswered > 0 ? totalExerciseTime / totalAnswered : 0;

      // Determine session result
      session.result = this.calculateSessionResult(session);

      // Clear timers
      this.clearSessionTimers(sessionId);

      // Save final session data
      await this.saveSession(sessionId);

      // Generate detailed analysis
      const analysis = await this.assessmentEngine.analyzeSession(session._id);

      // Check for promotion eligibility
      const promotionCheck = await this.promotionSystem.checkPromotionEligibility(
        session.studentId,
        session.curriculum,
        session.level
      );

      // Process automatic promotion if eligible
      let promotionResult = null;
      if (promotionCheck.eligible && promotionCheck.confidence >= 75) {
        try {
          promotionResult = await this.promotionSystem.processAutomaticPromotion(
            session.studentId,
            session.curriculum,
            promotionCheck
          );
        } catch (error) {
          console.error('Error processing automatic promotion:', error);
        }
      }

      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Emit session completed event
      if (this.io) {
        this.io.to(`student_${session.studentId}`).emit('sessionCompleted', {
          sessionId,
          result: session.result,
          accuracy: session.accuracy,
          completionRate: session.completionRate,
          averageTime: session.averageTimePerQuestion,
          promotionResult
        });

        if (session.trainerId) {
          this.io.to(`trainer_${session.trainerId}`).emit('studentSessionCompleted', {
            sessionId,
            studentCode: session.studentCode,
            result: session.result,
            analysis: {
              accuracy: session.accuracy,
              completionRate: session.completionRate,
              averageTime: session.averageTimePerQuestion
            }
          });
        }
      }

      console.log(`Session ${sessionId} completed with result: ${session.result}`);

      return {
        sessionId,
        result: session.result,
        statistics: {
          accuracy: session.accuracy,
          completionRate: session.completionRate,
          averageTime: session.averageTimePerQuestion,
          totalQuestions: session.totalQuestions,
          correctAnswers: session.correctAnswers,
          incorrectAnswers: session.incorrectAnswers,
          skippedQuestions: session.skippedQuestions || 0,
          actualDuration: session.actualDuration
        },
        analysis,
        promotionCheck,
        promotionResult
      };

    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  /**
   * Get session status and progress
   */
  async getSessionStatus(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) {
        // Try to load from database
        const session = await Session.findOne({ sessionId });
        if (!session) {
          throw new Error('Session not found');
        }
        
        return {
          status: session.status,
          message: 'Session found in database but not active'
        };
      }

      const session = sessionData.session;

      return {
        sessionId,
        status: session.status,
        progress: {
          current: session.currentQuestionIndex,
          total: session.totalQuestions,
          percentage: Math.round((session.currentQuestionIndex / session.totalQuestions) * 100)
        },
        statistics: {
          accuracy: session.accuracy || 0,
          correctAnswers: session.correctAnswers || 0,
          incorrectAnswers: session.incorrectAnswers || 0,
          skippedQuestions: session.skippedQuestions || 0,
          averageTime: session.averageTimePerQuestion || 0
        },
        timeRemaining: this.calculateTimeRemaining(session),
        lastActivity: sessionData.lastActivity,
        settings: session.settings
      };

    } catch (error) {
      console.error('Error getting session status:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validateAnswer(exercise, answer) {
    // Handle different answer types
    if (exercise.answerType === 'multiple_choice') {
      return answer === exercise.correctAnswer;
    } else if (exercise.answerType === 'numeric') {
      const numAnswer = parseFloat(answer);
      const correctNum = parseFloat(exercise.correctAnswer);
      return Math.abs(numAnswer - correctNum) < 0.001; // Allow small floating point errors
    } else if (exercise.answerType === 'text') {
      return answer.toLowerCase().trim() === exercise.correctAnswer.toLowerCase().trim();
    } else {
      return answer === exercise.correctAnswer;
    }
  }

  calculateTimeRemaining(session) {
    if (session.status === 'paused') {
      return session.timeRemainingWhenPaused || 0;
    }

    const elapsed = Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000);
    const totalPause = session.totalPauseDuration || 0;
    const netElapsed = elapsed - totalPause;
    
    return Math.max(0, session.duration - netElapsed);
  }

  calculateSessionResult(session) {
    const accuracy = session.accuracy || 0;
    const completionRate = session.completionRate || 0;

    if (accuracy >= 90 && completionRate >= 90) return 'excellent';
    if (accuracy >= 80 && completionRate >= 80) return 'good';
    if (accuracy >= 70 && completionRate >= 70) return 'satisfactory';
    if (accuracy >= 60 && completionRate >= 60) return 'needs_improvement';
    return 'poor';
  }

  setupSessionTimers(sessionId) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;

    // Auto-save timer
    sessionData.autoSaveTimer = setInterval(() => {
      this.saveSession(sessionId).catch(console.error);
    }, this.autoSaveInterval * 1000);

    // Session timeout timer
    const timeRemaining = this.calculateTimeRemaining(sessionData.session);
    if (timeRemaining > 0) {
      sessionData.timeoutTimer = setTimeout(() => {
        this.completeSession(sessionId, 'timeout').catch(console.error);
      }, timeRemaining * 1000);
    }
  }

  clearSessionTimers(sessionId) {
    const sessionData = this.activeSessions.get(sessionId);
    if (!sessionData) return;

    if (sessionData.autoSaveTimer) {
      clearInterval(sessionData.autoSaveTimer);
      sessionData.autoSaveTimer = null;
    }

    if (sessionData.timeoutTimer) {
      clearTimeout(sessionData.timeoutTimer);
      sessionData.timeoutTimer = null;
    }
  }

  async saveSession(sessionId) {
    try {
      const sessionData = this.activeSessions.get(sessionId);
      if (!sessionData) return;

      const session = sessionData.session;
      
      // Update time remaining if paused
      if (session.status === 'paused') {
        session.timeRemainingWhenPaused = this.calculateTimeRemaining(session);
      }

      await Session.findByIdAndUpdate(session._id, session, { new: true });
      
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  setupSocketHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      // Join user-specific rooms
      socket.on('join_user_room', (data) => {
        const { userId, userType } = data;
        socket.join(`${userType}_${userId}`);
      });

      // Handle session heartbeat
      socket.on('session_heartbeat', (data) => {
        const { sessionId } = data;
        const sessionData = this.activeSessions.get(sessionId);
        if (sessionData) {
          sessionData.lastActivity = Date.now();
        }
      });

      // Handle session disconnect
      socket.on('disconnect', () => {
        // Handle cleanup if needed
      });
    });
  }

  /**
   * Get active sessions for monitoring
   */
  getActiveSessions() {
    const sessions = [];
    
    for (const [sessionId, sessionData] of this.activeSessions) {
      const session = sessionData.session;
      sessions.push({
        sessionId,
        studentId: session.studentId,
        studentCode: session.studentCode,
        curriculum: session.curriculum,
        level: session.level,
        status: session.status,
        progress: {
          current: session.currentQuestionIndex,
          total: session.totalQuestions,
          percentage: Math.round((session.currentQuestionIndex / session.totalQuestions) * 100)
        },
        startTime: session.startTime,
        lastActivity: new Date(sessionData.lastActivity),
        timeRemaining: this.calculateTimeRemaining(session)
      });
    }

    return sessions;
  }

  /**
   * Force complete inactive sessions
   */
  async cleanupInactiveSessions(inactiveThreshold = 30 * 60 * 1000) { // 30 minutes
    const now = Date.now();
    const inactiveSessions = [];

    for (const [sessionId, sessionData] of this.activeSessions) {
      if (now - sessionData.lastActivity > inactiveThreshold) {
        inactiveSessions.push(sessionId);
      }
    }

    for (const sessionId of inactiveSessions) {
      try {
        await this.completeSession(sessionId, 'inactive');
        console.log(`Cleaned up inactive session: ${sessionId}`);
      } catch (error) {
        console.error(`Error cleaning up session ${sessionId}:`, error);
      }
    }

    return inactiveSessions.length;
  }
}

module.exports = SessionManager;
