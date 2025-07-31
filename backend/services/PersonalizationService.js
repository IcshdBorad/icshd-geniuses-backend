/**
 * Personalization Service for ICSHD GENIUSES
 * Handles intelligent session customization and adaptive learning paths
 */

const AdaptiveLearningEngine = require('../adaptive/AdaptiveLearningEngine');
const AdaptiveExerciseGenerator = require('../exercise-generator/AdaptiveExerciseGenerator');
const Session = require('../models/Session');
const User = require('../models/User');
const AdaptiveData = require('../models/AdaptiveData');

class PersonalizationService {
  constructor() {
    this.adaptiveEngine = new AdaptiveLearningEngine();
    this.exerciseGenerator = new AdaptiveExerciseGenerator();
    
    // Personalization strategies
    this.strategies = {
      conservative: { adaptationRate: 0.1, riskTolerance: 0.2 },
      moderate: { adaptationRate: 0.2, riskTolerance: 0.5 },
      aggressive: { adaptationRate: 0.3, riskTolerance: 0.8 }
    };

    // Session customization parameters
    this.sessionParameters = {
      minExercises: 5,
      maxExercises: 50,
      defaultDuration: 15,
      adaptiveBreakpoints: [0.3, 0.6, 0.8], // Points to reassess difficulty
      difficultyAdjustmentSteps: 0.1
    };
  }

  /**
   * Create personalized session configuration
   */
  async createPersonalizedSession(studentId, baseConfig) {
    try {
      const {
        curriculum,
        requestedLevel,
        duration,
        questionCount,
        preferences = {}
      } = baseConfig;

      // Get student profile and adaptive data
      const student = await User.findById(studentId);
      const adaptiveData = await this.adaptiveEngine.getAdaptiveData(studentId, curriculum);
      
      // Analyze recent performance
      const recentPerformance = await this.analyzeRecentPerformance(studentId, curriculum);
      
      // Determine optimal session parameters
      const sessionConfig = await this.optimizeSessionParameters(
        adaptiveData,
        recentPerformance,
        baseConfig,
        preferences
      );

      // Generate personalized exercise set
      const exercises = await this.generatePersonalizedExercises(
        studentId,
        sessionConfig
      );

      // Create adaptive session plan
      const sessionPlan = this.createAdaptiveSessionPlan(
        sessionConfig,
        exercises,
        adaptiveData
      );

      return {
        sessionConfig,
        exercises,
        sessionPlan,
        personalizationReasoning: this.getPersonalizationReasoning(
          adaptiveData,
          recentPerformance,
          sessionConfig
        )
      };
    } catch (error) {
      console.error('Error creating personalized session:', error);
      throw error;
    }
  }

  /**
   * Analyze recent performance trends
   */
  async analyzeRecentPerformance(studentId, curriculum, sessionLimit = 10) {
    try {
      const recentSessions = await Session.find({
        student: studentId,
        curriculum,
        status: 'completed'
      })
      .sort({ createdAt: -1 })
      .limit(sessionLimit)
      .populate('exercises.exercise');

      if (recentSessions.length === 0) {
        return {
          trend: 'no_data',
          averageAccuracy: 0,
          averageSpeed: 0,
          consistency: 0,
          improvementRate: 0,
          strugglingAreas: [],
          strongAreas: []
        };
      }

      // Calculate performance metrics
      const sessionMetrics = recentSessions.map(session => 
        this.adaptiveEngine.calculatePerformanceMetrics(session)
      );

      // Analyze trends
      const trend = this.analyzeTrend(sessionMetrics);
      const averageAccuracy = this.calculateAverage(sessionMetrics, 'accuracy');
      const averageSpeed = this.calculateAverage(sessionMetrics, 'averageTime');
      const consistency = this.calculateConsistency(sessionMetrics);
      const improvementRate = this.calculateImprovementRate(sessionMetrics);

      // Identify struggling and strong areas
      const { strugglingAreas, strongAreas } = await this.identifyPerformanceAreas(recentSessions);

      return {
        trend,
        averageAccuracy,
        averageSpeed,
        consistency,
        improvementRate,
        strugglingAreas,
        strongAreas,
        sessionCount: recentSessions.length
      };
    } catch (error) {
      console.error('Error analyzing recent performance:', error);
      throw error;
    }
  }

  /**
   * Optimize session parameters based on student profile
   */
  async optimizeSessionParameters(adaptiveData, recentPerformance, baseConfig, preferences) {
    const optimized = { ...baseConfig };

    // Adjust difficulty level
    optimized.targetDifficulty = this.calculateOptimalDifficulty(
      adaptiveData,
      recentPerformance,
      baseConfig.requestedLevel
    );

    // Optimize question count
    optimized.questionCount = this.optimizeQuestionCount(
      baseConfig.questionCount,
      recentPerformance,
      preferences
    );

    // Adjust time limits
    optimized.timeLimit = this.optimizeTimeLimit(
      adaptiveData,
      recentPerformance,
      preferences
    );

    // Set learning focus
    optimized.focusAreas = this.determineFocusAreas(
      adaptiveData,
      recentPerformance,
      preferences
    );

    // Configure adaptive features
    optimized.adaptiveFeatures = this.configureAdaptiveFeatures(
      adaptiveData,
      recentPerformance,
      preferences
    );

    return optimized;
  }

  /**
   * Calculate optimal difficulty level
   */
  calculateOptimalDifficulty(adaptiveData, recentPerformance, requestedLevel) {
    let targetDifficulty = adaptiveData.difficultyScore || 0.5;

    // Adjust based on recent performance trend
    if (recentPerformance.trend === 'improving') {
      targetDifficulty = Math.min(1.0, targetDifficulty + 0.1);
    } else if (recentPerformance.trend === 'declining') {
      targetDifficulty = Math.max(0.1, targetDifficulty - 0.1);
    }

    // Consider accuracy
    if (recentPerformance.averageAccuracy > 0.85) {
      targetDifficulty = Math.min(1.0, targetDifficulty + 0.05);
    } else if (recentPerformance.averageAccuracy < 0.65) {
      targetDifficulty = Math.max(0.1, targetDifficulty - 0.05);
    }

    // Factor in requested level vs current level
    const levelDifference = requestedLevel - adaptiveData.currentLevel;
    if (Math.abs(levelDifference) > 1) {
      // Significant level jump requested
      const adjustment = levelDifference > 0 ? 0.1 : -0.1;
      targetDifficulty = Math.max(0.1, Math.min(1.0, targetDifficulty + adjustment));
    }

    return Math.round(targetDifficulty * 100) / 100;
  }

  /**
   * Optimize question count based on performance and preferences
   */
  optimizeQuestionCount(requestedCount, recentPerformance, preferences) {
    let optimizedCount = requestedCount;

    // Adjust based on consistency
    if (recentPerformance.consistency < 0.5) {
      // Low consistency - reduce questions to maintain focus
      optimizedCount = Math.max(this.sessionParameters.minExercises, 
        Math.floor(requestedCount * 0.8));
    } else if (recentPerformance.consistency > 0.8) {
      // High consistency - can handle more questions
      optimizedCount = Math.min(this.sessionParameters.maxExercises, 
        Math.floor(requestedCount * 1.2));
    }

    // Consider average speed
    if (recentPerformance.averageSpeed > 60) {
      // Slow responses - reduce question count
      optimizedCount = Math.max(this.sessionParameters.minExercises, 
        Math.floor(optimizedCount * 0.9));
    }

    // Apply user preferences
    if (preferences.preferShorterSessions) {
      optimizedCount = Math.max(this.sessionParameters.minExercises, 
        Math.floor(optimizedCount * 0.8));
    } else if (preferences.preferLongerSessions) {
      optimizedCount = Math.min(this.sessionParameters.maxExercises, 
        Math.floor(optimizedCount * 1.3));
    }

    return optimizedCount;
  }

  /**
   * Optimize time limit per question
   */
  optimizeTimeLimit(adaptiveData, recentPerformance, preferences) {
    let baseTimeLimit = 60; // Default 60 seconds

    // Adjust based on learning style
    const learningStyleMultipliers = {
      visual: 1.1,
      auditory: 1.0,
      kinesthetic: 1.2,
      mixed: 1.0
    };

    baseTimeLimit *= learningStyleMultipliers[adaptiveData.learningStyle] || 1.0;

    // Adjust based on average speed
    if (recentPerformance.averageSpeed > 45) {
      baseTimeLimit *= 1.2; // Give more time for slower students
    } else if (recentPerformance.averageSpeed < 20) {
      baseTimeLimit *= 0.9; // Challenge faster students
    }

    // Apply preferences
    if (preferences.preferMoreTime) {
      baseTimeLimit *= 1.3;
    } else if (preferences.preferLessTime) {
      baseTimeLimit *= 0.8;
    }

    return Math.round(baseTimeLimit);
  }

  /**
   * Determine focus areas for the session
   */
  determineFocusAreas(adaptiveData, recentPerformance, preferences) {
    const focusAreas = [];

    // Primary focus: address weaknesses
    if (adaptiveData.weaknessAreas && adaptiveData.weaknessAreas.length > 0) {
      // Focus on the most critical weakness
      focusAreas.push(adaptiveData.weaknessAreas[0]);
    }

    // Secondary focus: reinforce strengths
    if (adaptiveData.strengthAreas && adaptiveData.strengthAreas.length > 0) {
      focusAreas.push(adaptiveData.strengthAreas[0]);
    }

    // Add struggling areas from recent performance
    if (recentPerformance.strugglingAreas) {
      recentPerformance.strugglingAreas.slice(0, 2).forEach(area => {
        if (!focusAreas.includes(area)) {
          focusAreas.push(area);
        }
      });
    }

    // Apply user preferences
    if (preferences.focusAreas) {
      preferences.focusAreas.forEach(area => {
        if (!focusAreas.includes(area)) {
          focusAreas.push(area);
        }
      });
    }

    return focusAreas.slice(0, 3); // Limit to 3 focus areas
  }

  /**
   * Configure adaptive features for the session
   */
  configureAdaptiveFeatures(adaptiveData, recentPerformance, preferences) {
    return {
      enableRealTimeAdjustment: recentPerformance.consistency > 0.6,
      enableHints: preferences.enableHints !== false,
      enableProgressiveDifficulty: recentPerformance.trend === 'improving',
      enableWeaknessDetection: true,
      adaptationSensitivity: this.calculateAdaptationSensitivity(recentPerformance),
      breakpointAdjustments: this.sessionParameters.adaptiveBreakpoints
    };
  }

  /**
   * Generate personalized exercises
   */
  async generatePersonalizedExercises(studentId, sessionConfig) {
    const adaptiveProfile = {
      targetDifficulty: sessionConfig.targetDifficulty,
      preferredTypes: sessionConfig.focusAreas,
      avoidTypes: [],
      learningStyle: sessionConfig.learningStyle || 'mixed',
      focusAreas: sessionConfig.focusAreas,
      weaknessAreas: sessionConfig.weaknessAreas || [],
      strengthAreas: sessionConfig.strengthAreas || []
    };

    return await this.exerciseGenerator.generateAdaptiveSet(
      sessionConfig.curriculum,
      sessionConfig.requestedLevel,
      sessionConfig.questionCount,
      adaptiveProfile
    );
  }

  /**
   * Create adaptive session plan with breakpoints
   */
  createAdaptiveSessionPlan(sessionConfig, exercises, adaptiveData) {
    const plan = {
      totalExercises: exercises.length,
      estimatedDuration: sessionConfig.questionCount * (sessionConfig.timeLimit / 60),
      adaptiveBreakpoints: [],
      difficultyProgression: [],
      recommendedPacing: this.calculateRecommendedPacing(sessionConfig, adaptiveData)
    };

    // Create breakpoints for adaptive adjustments
    this.sessionParameters.adaptiveBreakpoints.forEach(breakpoint => {
      const exerciseIndex = Math.floor(exercises.length * breakpoint);
      plan.adaptiveBreakpoints.push({
        exerciseIndex,
        assessmentType: 'performance_check',
        possibleAdjustments: ['difficulty', 'pacing', 'focus_areas']
      });
    });

    // Calculate difficulty progression
    exercises.forEach((exercise, index) => {
      plan.difficultyProgression.push({
        exerciseIndex: index,
        difficulty: exercise.difficulty,
        type: exercise.type,
        estimatedTime: exercise.timeLimit
      });
    });

    return plan;
  }

  /**
   * Calculate recommended pacing
   */
  calculateRecommendedPacing(sessionConfig, adaptiveData) {
    const averageTimePerExercise = sessionConfig.timeLimit;
    const totalEstimatedTime = sessionConfig.questionCount * averageTimePerExercise;
    
    return {
      averageTimePerExercise,
      totalEstimatedTime,
      recommendedBreaks: Math.floor(sessionConfig.questionCount / 10),
      pacingStrategy: adaptiveData.averageSpeed > 45 ? 'relaxed' : 'standard'
    };
  }

  /**
   * Real-time session adaptation during exercise
   */
  async adaptSessionInRealTime(sessionId, currentExerciseIndex, recentResponses) {
    try {
      const session = await Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Analyze recent responses (last 3-5 exercises)
      const recentMetrics = this.analyzeRecentResponses(recentResponses);
      
      // Determine if adaptation is needed
      const adaptationNeeded = this.shouldAdaptSession(recentMetrics, session);
      
      if (!adaptationNeeded) {
        return { adapted: false, reason: 'no_adaptation_needed' };
      }

      // Calculate adaptations
      const adaptations = await this.calculateSessionAdaptations(
        session,
        recentMetrics,
        currentExerciseIndex
      );

      // Apply adaptations to remaining exercises
      const updatedExercises = await this.applyAdaptations(
        session,
        adaptations,
        currentExerciseIndex
      );

      // Update session with new exercises
      session.exercises = updatedExercises;
      session.adaptationHistory = session.adaptationHistory || [];
      session.adaptationHistory.push({
        exerciseIndex: currentExerciseIndex,
        adaptations,
        timestamp: new Date(),
        reason: adaptations.reason
      });

      await session.save();

      return {
        adapted: true,
        adaptations,
        updatedExercises: updatedExercises.slice(currentExerciseIndex + 1),
        reasoning: adaptations.reasoning
      };
    } catch (error) {
      console.error('Error adapting session in real-time:', error);
      throw error;
    }
  }

  /**
   * Analyze recent responses for adaptation decisions
   */
  analyzeRecentResponses(recentResponses) {
    if (!recentResponses || recentResponses.length === 0) {
      return { accuracy: 0, averageTime: 0, trend: 'no_data' };
    }

    const correctCount = recentResponses.filter(r => r.isCorrect).length;
    const accuracy = correctCount / recentResponses.length;
    const averageTime = recentResponses.reduce((sum, r) => sum + r.timeSpent, 0) / recentResponses.length;
    
    // Determine trend
    let trend = 'stable';
    if (recentResponses.length >= 3) {
      const firstHalf = recentResponses.slice(0, Math.floor(recentResponses.length / 2));
      const secondHalf = recentResponses.slice(Math.floor(recentResponses.length / 2));
      
      const firstAccuracy = firstHalf.filter(r => r.isCorrect).length / firstHalf.length;
      const secondAccuracy = secondHalf.filter(r => r.isCorrect).length / secondHalf.length;
      
      if (secondAccuracy > firstAccuracy + 0.2) trend = 'improving';
      else if (secondAccuracy < firstAccuracy - 0.2) trend = 'declining';
    }

    return { accuracy, averageTime, trend };
  }

  /**
   * Determine if session adaptation is needed
   */
  shouldAdaptSession(recentMetrics, session) {
    // Adapt if accuracy is too low
    if (recentMetrics.accuracy < 0.4) return true;
    
    // Adapt if accuracy is too high (too easy)
    if (recentMetrics.accuracy > 0.9) return true;
    
    // Adapt if responses are too slow
    if (recentMetrics.averageTime > session.timeLimit * 1.5) return true;
    
    // Adapt if responses are too fast (might be guessing)
    if (recentMetrics.averageTime < 10 && recentMetrics.accuracy < 0.7) return true;
    
    return false;
  }

  /**
   * Calculate specific adaptations needed
   */
  async calculateSessionAdaptations(session, recentMetrics, currentIndex) {
    const adaptations = {
      difficultyAdjustment: 0,
      timeAdjustment: 0,
      exerciseTypeChanges: [],
      focusAreaShifts: [],
      reason: '',
      reasoning: ''
    };

    // Difficulty adjustments
    if (recentMetrics.accuracy < 0.4) {
      adaptations.difficultyAdjustment = -0.2;
      adaptations.reason = 'low_accuracy';
      adaptations.reasoning = 'تقليل الصعوبة بسبب انخفاض الدقة';
    } else if (recentMetrics.accuracy > 0.9) {
      adaptations.difficultyAdjustment = 0.2;
      adaptations.reason = 'high_accuracy';
      adaptations.reasoning = 'زيادة الصعوبة بسبب ارتفاع الدقة';
    }

    // Time adjustments
    if (recentMetrics.averageTime > session.timeLimit * 1.2) {
      adaptations.timeAdjustment = 15;
      adaptations.reasoning += ' - زيادة الوقت المسموح';
    } else if (recentMetrics.averageTime < 15) {
      adaptations.timeAdjustment = -10;
      adaptations.reasoning += ' - تقليل الوقت المسموح';
    }

    return adaptations;
  }

  /**
   * Apply adaptations to remaining exercises
   */
  async applyAdaptations(session, adaptations, currentIndex) {
    const exercises = [...session.exercises];
    
    // Apply to remaining exercises
    for (let i = currentIndex + 1; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      // Adjust difficulty
      if (adaptations.difficultyAdjustment !== 0) {
        const newDifficulty = Math.max(1, Math.min(5, 
          exercise.difficulty + Math.round(adaptations.difficultyAdjustment * 5)
        ));
        exercise.difficulty = newDifficulty;
      }
      
      // Adjust time limit
      if (adaptations.timeAdjustment !== 0) {
        exercise.timeLimit = Math.max(15, exercise.timeLimit + adaptations.timeAdjustment);
      }
    }

    return exercises;
  }

  /**
   * Get personalization reasoning for transparency
   */
  getPersonalizationReasoning(adaptiveData, recentPerformance, sessionConfig) {
    const reasoning = {
      difficultyLevel: `تم تحديد مستوى الصعوبة ${Math.round(sessionConfig.targetDifficulty * 100)}% بناءً على أداءك السابق`,
      exerciseCount: `تم اختيار ${sessionConfig.questionCount} سؤال بناءً على مستوى تركيزك`,
      focusAreas: sessionConfig.focusAreas.length > 0 
        ? `سيتم التركيز على: ${sessionConfig.focusAreas.join('، ')}`
        : 'تمارين متنوعة لتطوير جميع المهارات',
      adaptiveFeatures: sessionConfig.adaptiveFeatures.enableRealTimeAdjustment
        ? 'سيتم تعديل الصعوبة تلقائياً أثناء الجلسة'
        : 'صعوبة ثابتة طوال الجلسة'
    };

    return reasoning;
  }

  /**
   * Utility methods
   */
  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric[field], 0) / metrics.length;
  }

  calculateConsistency(metrics) {
    if (metrics.length < 2) return 0;
    const accuracies = metrics.map(m => m.accuracy);
    const mean = this.calculateAverage(metrics, 'accuracy');
    const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
    return Math.max(0, 1 - variance);
  }

  calculateImprovementRate(metrics) {
    if (metrics.length < 2) return 0;
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));
    
    const firstAvg = this.calculateAverage(firstHalf, 'accuracy');
    const secondAvg = this.calculateAverage(secondHalf, 'accuracy');
    
    return secondAvg - firstAvg;
  }

  analyzeTrend(metrics) {
    if (metrics.length < 3) return 'insufficient_data';
    
    const improvementRate = this.calculateImprovementRate(metrics);
    
    if (improvementRate > 0.1) return 'improving';
    if (improvementRate < -0.1) return 'declining';
    return 'stable';
  }

  async identifyPerformanceAreas(sessions) {
    const areaPerformance = {};
    
    sessions.forEach(session => {
      session.exercises.forEach(ex => {
        const type = ex.exercise?.type || 'unknown';
        if (!areaPerformance[type]) {
          areaPerformance[type] = { correct: 0, total: 0 };
        }
        areaPerformance[type].total++;
        if (ex.isCorrect) areaPerformance[type].correct++;
      });
    });

    const areas = Object.entries(areaPerformance).map(([type, data]) => ({
      type,
      accuracy: data.correct / data.total
    }));

    areas.sort((a, b) => a.accuracy - b.accuracy);

    return {
      strugglingAreas: areas.slice(0, 2).map(a => a.type),
      strongAreas: areas.slice(-2).map(a => a.type)
    };
  }

  calculateAdaptationSensitivity(recentPerformance) {
    if (recentPerformance.consistency > 0.8) return 'low';
    if (recentPerformance.consistency > 0.6) return 'medium';
    return 'high';
  }
}

module.exports = PersonalizationService;
