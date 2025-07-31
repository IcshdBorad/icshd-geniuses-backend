/**
 * Main Exercise Generator for ICSHD GENIUSES
 * Coordinates all exercise generators and provides unified interface
 */

const SorobanGenerator = require('./SorobanGenerator');
const VedicGenerator = require('./VedicGenerator');
const LogicGenerator = require('./LogicGenerator');
const IQGamesGenerator = require('./IQGamesGenerator');

class MainGenerator {
  constructor() {
    this.generators = {
      soroban: new SorobanGenerator(),
      vedic: new VedicGenerator(),
      logic: new LogicGenerator(),
      iq_games: new IQGamesGenerator(),
      multiplication: new SorobanGenerator(), // Reuse for basic multiplication
      division: new SorobanGenerator() // Reuse for basic division
    };

    this.curriculumLevels = {
      soroban: ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'],
      vedic: ['V1', 'V2', 'V3', 'V4', 'V5'],
      logic: ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'],
      iq_games: ['IQ1', 'IQ2', 'IQ3', 'IQ4', 'IQ5', 'IQ6'],
      multiplication: ['M1', 'M2', 'M3', 'M4', 'M5'],
      division: ['D1', 'D2', 'D3', 'D4', 'D5']
    };

    this.ageGroupMappings = {
      'under_7': {
        soroban: ['A1', 'A2'],
        logic: ['L1'],
        iq_games: ['IQ1']
      },
      '7_to_10': {
        soroban: ['A1', 'A2', 'A3', 'B1', 'B2'],
        multiplication: ['M1', 'M2'],
        division: ['D1'],
        logic: ['L1', 'L2'],
        iq_games: ['IQ1', 'IQ2']
      },
      'over_10': {
        soroban: ['B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'D1', 'D2', 'D3'],
        multiplication: ['M1', 'M2', 'M3', 'M4', 'M5'],
        division: ['D1', 'D2', 'D3', 'D4', 'D5'],
        logic: ['L3', 'L4', 'L5', 'L6'],
        iq_games: ['IQ3', 'IQ4', 'IQ5', 'IQ6']
      },
      'under_12': {
        vedic: ['V1', 'V2']
      },
      'over_12': {
        vedic: ['V3', 'V4', 'V5']
      }
    };

    this.exerciseCache = new Map();
    this.sessionHistory = new Map();
  }

  /**
   * Generate exercises for a training session
   * @param {Object} config - Session configuration
   * @returns {Array} Generated exercises
   */
  async generateSession(config) {
    try {
      const {
        studentId,
        studentCode,
        curriculum,
        level,
        ageGroup,
        count = 10,
        exerciseType = null,
        difficulty = 'medium',
        timeLimit = 600, // 10 minutes default
        focusAreas = [],
        avoidAreas = [],
        adaptiveData = null,
        sessionType = 'practice' // practice, assessment, review
      } = config;

      // Validate configuration
      this.validateConfig(config);

      // Apply adaptive adjustments if available
      const adjustedConfig = this.applyAdaptiveAdjustments(config, adaptiveData);

      // Generate exercises using appropriate generator
      const exercises = await this.generateExercises(adjustedConfig);

      // Post-process exercises
      const processedExercises = this.postProcessExercises(exercises, adjustedConfig);

      // Cache session for future reference
      this.cacheSession(studentId, {
        config: adjustedConfig,
        exercises: processedExercises,
        timestamp: new Date()
      });

      return {
        sessionId: this.generateSessionId(),
        exercises: processedExercises,
        config: adjustedConfig,
        metadata: {
          totalQuestions: processedExercises.length,
          estimatedDuration: this.calculateEstimatedDuration(processedExercises),
          difficultyDistribution: this.getDifficultyDistribution(processedExercises),
          exerciseTypes: this.getExerciseTypeDistribution(processedExercises)
        }
      };

    } catch (error) {
      console.error('Error generating session:', error);
      throw new Error(`Failed to generate session: ${error.message}`);
    }
  }

  /**
   * Generate exercises using the appropriate generator
   */
  async generateExercises(config) {
    const { curriculum, level, ageGroup, count, exerciseType, difficulty, focusAreas, adaptiveData } = config;

    const generator = this.generators[curriculum];
    if (!generator) {
      throw new Error(`No generator found for curriculum: ${curriculum}`);
    }

    // Prepare generator-specific configuration
    const generatorConfig = {
      level,
      ageGroup,
      count,
      exerciseType,
      difficulty,
      focusAreas,
      adaptiveData
    };

    // Generate exercises
    const exercises = generator.generateExercises(generatorConfig);

    // Add metadata to each exercise
    return exercises.map((exercise, index) => ({
      ...exercise,
      exerciseId: this.generateExerciseId(curriculum, level, index),
      curriculum,
      level,
      ageGroup,
      orderIndex: index + 1,
      generatedAt: new Date(),
      metadata: {
        generator: curriculum,
        version: '1.0.0'
      }
    }));
  }

  /**
   * Apply adaptive learning adjustments to configuration
   */
  applyAdaptiveAdjustments(config, adaptiveData) {
    if (!adaptiveData) {
      return config;
    }

    const adjustedConfig = { ...config };

    // Adjust difficulty based on recent performance
    if (adaptiveData.currentSettings) {
      const { difficultyMultiplier, timeMultiplier, focusAreas, avoidAreas } = adaptiveData.currentSettings;

      // Adjust difficulty
      if (difficultyMultiplier !== 1.0) {
        adjustedConfig.difficulty = this.adjustDifficulty(config.difficulty, difficultyMultiplier);
      }

      // Adjust time limits
      if (timeMultiplier !== 1.0) {
        adjustedConfig.timeLimit = Math.round(config.timeLimit * timeMultiplier);
      }

      // Add focus areas from adaptive data
      if (focusAreas && focusAreas.length > 0) {
        adjustedConfig.focusAreas = [...(config.focusAreas || []), ...focusAreas];
      }

      // Add avoid areas from adaptive data
      if (avoidAreas && avoidAreas.length > 0) {
        adjustedConfig.avoidAreas = [...(config.avoidAreas || []), ...avoidAreas];
      }
    }

    // Adjust based on weak areas
    if (adaptiveData.performancePatterns && adaptiveData.performancePatterns.weakAreas) {
      const weakAreas = adaptiveData.performancePatterns.weakAreas
        .filter(area => area.accuracy < 70)
        .map(area => area.category);
      
      if (weakAreas.length > 0) {
        adjustedConfig.focusAreas = [...(adjustedConfig.focusAreas || []), ...weakAreas];
      }
    }

    return adjustedConfig;
  }

  /**
   * Post-process generated exercises
   */
  postProcessExercises(exercises, config) {
    return exercises.map(exercise => {
      // Add session-specific metadata
      exercise.sessionMetadata = {
        adaptiveAdjustments: config.adaptiveAdjustments || {},
        originalDifficulty: config.difficulty,
        adjustedDifficulty: exercise.difficulty
      };

      // Ensure consistent time limits
      if (config.timeLimit) {
        exercise.timeLimit = Math.min(exercise.timeLimit, config.timeLimit / exercises.length);
      }

      // Add progressive difficulty if needed
      if (config.progressiveDifficulty) {
        exercise.difficulty = this.calculateProgressiveDifficulty(
          exercise.difficulty,
          exercise.orderIndex,
          exercises.length
        );
      }

      return exercise;
    });
  }

  /**
   * Validate session configuration
   */
  validateConfig(config) {
    const { curriculum, level, ageGroup, count } = config;

    if (!curriculum || !this.generators[curriculum]) {
      throw new Error(`Invalid curriculum: ${curriculum}`);
    }

    if (!level || !this.curriculumLevels[curriculum].includes(level)) {
      throw new Error(`Invalid level ${level} for curriculum ${curriculum}`);
    }

    if (!ageGroup || !this.ageGroupMappings[ageGroup]) {
      throw new Error(`Invalid age group: ${ageGroup}`);
    }

    // Check if level is appropriate for age group
    const appropriateLevels = this.ageGroupMappings[ageGroup][curriculum];
    if (appropriateLevels && !appropriateLevels.includes(level)) {
      console.warn(`Level ${level} may not be appropriate for age group ${ageGroup}`);
    }

    if (!count || count < 1 || count > 100) {
      throw new Error('Exercise count must be between 1 and 100');
    }
  }

  /**
   * Generate exercises for assessment/testing
   */
  async generateAssessment(config) {
    const assessmentConfig = {
      ...config,
      sessionType: 'assessment',
      adaptiveData: null, // No adaptive adjustments for assessments
      difficulty: 'mixed', // Mix of difficulties for comprehensive assessment
      focusAreas: [], // Cover all areas
      count: config.count || 20
    };

    const session = await this.generateSession(assessmentConfig);
    
    // Add assessment-specific metadata
    session.assessmentMetadata = {
      type: 'level_assessment',
      coverageAreas: this.getAssessmentCoverage(config.curriculum, config.level),
      scoringCriteria: this.getAssessmentScoringCriteria(config.curriculum, config.level)
    };

    return session;
  }

  /**
   * Generate review exercises based on previous performance
   */
  async generateReview(config) {
    const { studentId, adaptiveData } = config;

    if (!adaptiveData || !adaptiveData.performancePatterns) {
      throw new Error('Adaptive data required for review session');
    }

    // Focus on weak areas and recent mistakes
    const weakAreas = adaptiveData.performancePatterns.weakAreas
      .filter(area => area.accuracy < 80)
      .map(area => area.category);

    const reviewConfig = {
      ...config,
      sessionType: 'review',
      focusAreas: weakAreas,
      difficulty: 'easy', // Start easier for review
      count: Math.min(config.count || 15, 20)
    };

    return await this.generateSession(reviewConfig);
  }

  /**
   * Get next level recommendation based on performance
   */
  getNextLevelRecommendation(curriculum, currentLevel, performanceData) {
    const levels = this.curriculumLevels[curriculum];
    const currentIndex = levels.indexOf(currentLevel);

    if (currentIndex === -1) {
      throw new Error(`Invalid current level: ${currentLevel}`);
    }

    // Check if student is ready for promotion
    const isReadyForPromotion = this.checkPromotionReadiness(performanceData);

    if (isReadyForPromotion && currentIndex < levels.length - 1) {
      return {
        recommended: true,
        nextLevel: levels[currentIndex + 1],
        reason: 'Performance criteria met for advancement',
        confidence: this.calculatePromotionConfidence(performanceData)
      };
    }

    return {
      recommended: false,
      nextLevel: currentLevel,
      reason: 'Continue practicing current level',
      suggestions: this.getImprovementSuggestions(performanceData)
    };
  }

  /**
   * Utility methods
   */
  generateSessionId() {
    return `SES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  generateExerciseId(curriculum, level, index) {
    return `${curriculum.toUpperCase()}-${level}-${Date.now()}-${index}`;
  }

  adjustDifficulty(currentDifficulty, multiplier) {
    const difficulties = ['easy', 'medium', 'hard'];
    const currentIndex = difficulties.indexOf(currentDifficulty);
    
    if (multiplier < 0.8) {
      return difficulties[Math.max(0, currentIndex - 1)];
    } else if (multiplier > 1.2) {
      return difficulties[Math.min(2, currentIndex + 1)];
    }
    
    return currentDifficulty;
  }

  calculateProgressiveDifficulty(baseDifficulty, orderIndex, totalExercises) {
    // Gradually increase difficulty throughout the session
    const progressRatio = orderIndex / totalExercises;
    const difficulties = ['easy', 'medium', 'hard'];
    const baseIndex = difficulties.indexOf(baseDifficulty);
    
    if (progressRatio > 0.7 && baseIndex < 2) {
      return difficulties[baseIndex + 1];
    }
    
    return baseDifficulty;
  }

  calculateEstimatedDuration(exercises) {
    return exercises.reduce((total, exercise) => total + (exercise.timeLimit || 30), 0);
  }

  getDifficultyDistribution(exercises) {
    const distribution = { easy: 0, medium: 0, hard: 0 };
    exercises.forEach(exercise => {
      distribution[exercise.difficulty] = (distribution[exercise.difficulty] || 0) + 1;
    });
    return distribution;
  }

  getExerciseTypeDistribution(exercises) {
    const distribution = {};
    exercises.forEach(exercise => {
      distribution[exercise.type] = (distribution[exercise.type] || 0) + 1;
    });
    return distribution;
  }

  checkPromotionReadiness(performanceData) {
    if (!performanceData) return false;
    
    const { averageAccuracy, averageTime, consecutiveSuccessfulSessions } = performanceData;
    
    return averageAccuracy >= 85 && 
           averageTime <= 6 && 
           consecutiveSuccessfulSessions >= 3;
  }

  calculatePromotionConfidence(performanceData) {
    const { averageAccuracy, averageTime, consecutiveSuccessfulSessions } = performanceData;
    
    let confidence = 0;
    confidence += Math.min(averageAccuracy / 85, 1.2) * 0.4; // 40% weight
    confidence += Math.min(6 / averageTime, 1.2) * 0.3; // 30% weight
    confidence += Math.min(consecutiveSuccessfulSessions / 3, 1.2) * 0.3; // 30% weight
    
    return Math.min(confidence, 1.0);
  }

  getImprovementSuggestions(performanceData) {
    const suggestions = [];
    
    if (performanceData.averageAccuracy < 85) {
      suggestions.push('Focus on accuracy - practice more slowly and carefully');
    }
    
    if (performanceData.averageTime > 6) {
      suggestions.push('Work on speed - practice mental calculation techniques');
    }
    
    if (performanceData.consecutiveSuccessfulSessions < 3) {
      suggestions.push('Maintain consistent practice to build confidence');
    }
    
    return suggestions;
  }

  getAssessmentCoverage(curriculum, level) {
    // Define what areas should be covered in assessment for each curriculum/level
    const coverage = {
      soroban: {
        A1: ['simple_addition', 'simple_subtraction'],
        B1: ['simple_addition', 'simple_subtraction', 'friends_of_5'],
        C1: ['simple_addition', 'simple_subtraction', 'friends_of_5', 'friends_of_10']
      },
      vedic: {
        V1: ['squares_ending_5', 'multiplication_11'],
        V2: ['squares_ending_5', 'multiplication_11', 'subtraction_complement']
      }
    };
    
    return coverage[curriculum]?.[level] || [];
  }

  getAssessmentScoringCriteria(curriculum, level) {
    return {
      passingAccuracy: 70,
      excellentAccuracy: 90,
      maxTimePerQuestion: 10,
      excellentTimePerQuestion: 5
    };
  }

  cacheSession(studentId, sessionData) {
    if (!this.sessionHistory.has(studentId)) {
      this.sessionHistory.set(studentId, []);
    }
    
    const history = this.sessionHistory.get(studentId);
    history.push(sessionData);
    
    // Keep only last 10 sessions
    if (history.length > 10) {
      history.shift();
    }
  }

  getSessionHistory(studentId) {
    return this.sessionHistory.get(studentId) || [];
  }

  clearCache() {
    this.exerciseCache.clear();
    this.sessionHistory.clear();
  }
}

module.exports = MainGenerator;
