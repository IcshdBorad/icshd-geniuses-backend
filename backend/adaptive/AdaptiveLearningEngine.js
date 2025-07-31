/**
 * Adaptive Learning Engine for ICSHD GENIUSES
 * Handles personalized learning paths and difficulty adjustment
 */

const AdaptiveData = require('../models/AdaptiveData');
const Session = require('../models/Session');
const Exercise = require('../models/Exercise');
const ExerciseGenerator = require('../exercise-generator/ExerciseGenerator');

class AdaptiveLearningEngine {
  constructor() {
    this.difficultyFactors = {
      accuracy: 0.4,        // 40% weight on accuracy
      speed: 0.3,           // 30% weight on speed
      consistency: 0.2,     // 20% weight on consistency
      progression: 0.1      // 10% weight on progression rate
    };

    this.adaptationThresholds = {
      increaseThreshold: 0.85,  // Increase difficulty if performance > 85%
      decreaseThreshold: 0.65,  // Decrease difficulty if performance < 65%
      minAccuracy: 0.5,         // Minimum accuracy to maintain level
      maxConsecutiveErrors: 3,   // Max consecutive errors before adjustment
    };

    this.learningStyles = {
      visual: { imageWeight: 1.5, textWeight: 0.8 },
      auditory: { soundWeight: 1.5, textWeight: 1.0 },
      kinesthetic: { interactiveWeight: 1.5, staticWeight: 0.8 },
      mixed: { imageWeight: 1.0, textWeight: 1.0, soundWeight: 1.0 }
    };
  }

  /**
   * Get or create adaptive data for a student
   */
  async getAdaptiveData(studentId, curriculum) {
    try {
      let adaptiveData = await AdaptiveData.findOne({ 
        studentId, 
        curriculum 
      });

      if (!adaptiveData) {
        adaptiveData = new AdaptiveData({
          studentId,
          curriculum,
          currentLevel: 1,
          difficultyScore: 0.5,
          learningStyle: 'mixed',
          performanceHistory: [],
          weaknessAreas: [],
          strengthAreas: [],
          preferredExerciseTypes: [],
          adaptationHistory: [],
          lastUpdated: new Date()
        });
        await adaptiveData.save();
      }

      return adaptiveData;
    } catch (error) {
      console.error('Error getting adaptive data:', error);
      throw error;
    }
  }

  /**
   * Analyze student performance and update adaptive data
   */
  async analyzePerformance(studentId, sessionId) {
    try {
      const session = await Session.findById(sessionId)
        .populate('exercises.exercise');

      if (!session) {
        throw new Error('Session not found');
      }

      const adaptiveData = await this.getAdaptiveData(studentId, session.curriculum);
      
      // Calculate performance metrics
      const metrics = this.calculatePerformanceMetrics(session);
      
      // Update performance history
      this.updatePerformanceHistory(adaptiveData, metrics);
      
      // Identify strengths and weaknesses
      await this.identifyStrengthsWeaknesses(adaptiveData, session);
      
      // Detect learning style
      this.detectLearningStyle(adaptiveData, session);
      
      // Calculate new difficulty score
      const newDifficultyScore = this.calculateDifficultyScore(adaptiveData, metrics);
      
      // Update adaptive data
      adaptiveData.difficultyScore = newDifficultyScore;
      adaptiveData.lastSessionMetrics = metrics;
      adaptiveData.lastUpdated = new Date();
      
      // Add adaptation history entry
      adaptiveData.adaptationHistory.push({
        sessionId,
        oldDifficulty: adaptiveData.difficultyScore,
        newDifficulty: newDifficultyScore,
        reason: this.getAdaptationReason(metrics),
        timestamp: new Date()
      });

      // Keep only last 50 adaptation history entries
      if (adaptiveData.adaptationHistory.length > 50) {
        adaptiveData.adaptationHistory = adaptiveData.adaptationHistory.slice(-50);
      }

      await adaptiveData.save();
      
      return {
        metrics,
        adaptiveData,
        recommendations: this.generateRecommendations(adaptiveData, metrics)
      };
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive performance metrics
   */
  calculatePerformanceMetrics(session) {
    const exercises = session.exercises || [];
    const totalExercises = exercises.length;
    
    if (totalExercises === 0) {
      return {
        accuracy: 0,
        averageTime: 0,
        consistency: 0,
        difficultyHandling: 0,
        errorPatterns: [],
        speedTrend: 'stable'
      };
    }

    // Basic metrics
    const correctAnswers = exercises.filter(ex => ex.isCorrect).length;
    const accuracy = correctAnswers / totalExercises;
    
    const totalTime = exercises.reduce((sum, ex) => sum + (ex.timeSpent || 0), 0);
    const averageTime = totalTime / totalExercises;
    
    // Consistency calculation (standard deviation of response times)
    const times = exercises.map(ex => ex.timeSpent || 0);
    const timeVariance = this.calculateVariance(times);
    const consistency = Math.max(0, 1 - (timeVariance / (averageTime * averageTime)));
    
    // Difficulty handling
    const difficultyScores = exercises.map(ex => {
      const difficulty = ex.exercise?.difficulty || 1;
      return ex.isCorrect ? difficulty : 0;
    });
    const difficultyHandling = difficultyScores.reduce((sum, score) => sum + score, 0) / totalExercises;
    
    // Error patterns
    const errorPatterns = this.identifyErrorPatterns(exercises);
    
    // Speed trend analysis
    const speedTrend = this.analyzeSpeedTrend(exercises);
    
    return {
      accuracy,
      averageTime,
      consistency,
      difficultyHandling,
      errorPatterns,
      speedTrend,
      totalExercises,
      correctAnswers
    };
  }

  /**
   * Update performance history with decay factor
   */
  updatePerformanceHistory(adaptiveData, newMetrics) {
    const history = adaptiveData.performanceHistory || [];
    
    // Add new metrics
    history.push({
      ...newMetrics,
      timestamp: new Date()
    });
    
    // Keep only last 20 sessions
    if (history.length > 20) {
      adaptiveData.performanceHistory = history.slice(-20);
    } else {
      adaptiveData.performanceHistory = history;
    }
    
    // Calculate weighted averages with decay
    const weights = history.map((_, index) => Math.pow(0.9, history.length - 1 - index));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    adaptiveData.averageAccuracy = history.reduce((sum, metrics, index) => 
      sum + metrics.accuracy * weights[index], 0) / totalWeight;
    
    adaptiveData.averageSpeed = history.reduce((sum, metrics, index) => 
      sum + metrics.averageTime * weights[index], 0) / totalWeight;
    
    adaptiveData.averageConsistency = history.reduce((sum, metrics, index) => 
      sum + metrics.consistency * weights[index], 0) / totalWeight;
  }

  /**
   * Identify strengths and weaknesses based on exercise types
   */
  async identifyStrengthsWeaknesses(adaptiveData, session) {
    const exercises = session.exercises || [];
    const typePerformance = {};
    
    // Group by exercise type
    exercises.forEach(ex => {
      const type = ex.exercise?.type || 'unknown';
      if (!typePerformance[type]) {
        typePerformance[type] = { correct: 0, total: 0, totalTime: 0 };
      }
      
      typePerformance[type].total++;
      typePerformance[type].totalTime += ex.timeSpent || 0;
      if (ex.isCorrect) {
        typePerformance[type].correct++;
      }
    });
    
    // Calculate performance scores for each type
    const typeScores = Object.entries(typePerformance).map(([type, data]) => ({
      type,
      accuracy: data.correct / data.total,
      averageTime: data.totalTime / data.total,
      score: (data.correct / data.total) * (1 / (data.totalTime / data.total))
    }));
    
    // Sort by performance
    typeScores.sort((a, b) => b.score - a.score);
    
    // Update strengths (top 30%) and weaknesses (bottom 30%)
    const strengthCount = Math.ceil(typeScores.length * 0.3);
    const weaknessCount = Math.ceil(typeScores.length * 0.3);
    
    adaptiveData.strengthAreas = typeScores
      .slice(0, strengthCount)
      .map(item => item.type);
    
    adaptiveData.weaknessAreas = typeScores
      .slice(-weaknessCount)
      .map(item => item.type);
  }

  /**
   * Detect learning style based on exercise preferences
   */
  detectLearningStyle(adaptiveData, session) {
    const exercises = session.exercises || [];
    const styleScores = {
      visual: 0,
      auditory: 0,
      kinesthetic: 0,
      mixed: 0
    };
    
    exercises.forEach(ex => {
      if (ex.isCorrect) {
        const exercise = ex.exercise;
        if (exercise?.metadata?.hasImage) styleScores.visual++;
        if (exercise?.metadata?.hasAudio) styleScores.auditory++;
        if (exercise?.metadata?.isInteractive) styleScores.kinesthetic++;
        styleScores.mixed++;
      }
    });
    
    // Determine dominant learning style
    const maxScore = Math.max(...Object.values(styleScores));
    const dominantStyle = Object.keys(styleScores).find(style => styleScores[style] === maxScore);
    
    // Update learning style with confidence
    if (maxScore > exercises.length * 0.6) {
      adaptiveData.learningStyle = dominantStyle;
    }
  }

  /**
   * Calculate new difficulty score
   */
  calculateDifficultyScore(adaptiveData, metrics) {
    const current = adaptiveData.difficultyScore || 0.5;
    const factors = this.difficultyFactors;
    
    // Calculate performance score
    const performanceScore = 
      metrics.accuracy * factors.accuracy +
      (1 - Math.min(metrics.averageTime / 60, 1)) * factors.speed +
      metrics.consistency * factors.consistency +
      metrics.difficultyHandling * factors.progression;
    
    // Determine adjustment direction and magnitude
    let adjustment = 0;
    
    if (performanceScore > this.adaptationThresholds.increaseThreshold) {
      // Increase difficulty
      adjustment = (performanceScore - this.adaptationThresholds.increaseThreshold) * 0.1;
    } else if (performanceScore < this.adaptationThresholds.decreaseThreshold) {
      // Decrease difficulty
      adjustment = (performanceScore - this.adaptationThresholds.decreaseThreshold) * 0.1;
    }
    
    // Apply adjustment with bounds
    const newScore = Math.max(0.1, Math.min(1.0, current + adjustment));
    
    return Math.round(newScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Generate personalized exercise recommendations
   */
  async generatePersonalizedExercises(studentId, curriculum, count = 10) {
    try {
      const adaptiveData = await this.getAdaptiveData(studentId, curriculum);
      const generator = new ExerciseGenerator();
      
      const recommendations = {
        targetDifficulty: adaptiveData.difficultyScore,
        preferredTypes: this.getPreferredExerciseTypes(adaptiveData),
        avoidTypes: adaptiveData.weaknessAreas.slice(0, 2), // Limit weakness focus
        learningStyle: adaptiveData.learningStyle,
        focusAreas: this.getFocusAreas(adaptiveData)
      };
      
      const exercises = await generator.generateAdaptiveSet(
        curriculum,
        adaptiveData.currentLevel,
        count,
        recommendations
      );
      
      return {
        exercises,
        reasoning: this.getRecommendationReasoning(adaptiveData, recommendations),
        adaptiveData
      };
    } catch (error) {
      console.error('Error generating personalized exercises:', error);
      throw error;
    }
  }

  /**
   * Get preferred exercise types based on performance
   */
  getPreferredExerciseTypes(adaptiveData) {
    const preferred = [];
    
    // Add strength areas
    preferred.push(...adaptiveData.strengthAreas);
    
    // Add some weakness areas for improvement (balanced approach)
    if (adaptiveData.weaknessAreas.length > 0) {
      preferred.push(adaptiveData.weaknessAreas[0]); // Focus on one weakness at a time
    }
    
    return preferred;
  }

  /**
   * Get focus areas for targeted practice
   */
  getFocusAreas(adaptiveData) {
    const focusAreas = [];
    
    // Focus on weaknesses that are improving
    const improvingWeaknesses = adaptiveData.weaknessAreas.filter(area => {
      // Check if this area is showing improvement in recent sessions
      return this.isAreaImproving(adaptiveData, area);
    });
    
    focusAreas.push(...improvingWeaknesses);
    
    // Add challenging areas from strengths for advancement
    if (adaptiveData.strengthAreas.length > 0) {
      focusAreas.push(adaptiveData.strengthAreas[0]);
    }
    
    return focusAreas;
  }

  /**
   * Check if a specific area is improving
   */
  isAreaImproving(adaptiveData, area) {
    const recentHistory = adaptiveData.performanceHistory.slice(-5);
    if (recentHistory.length < 2) return false;
    
    // Simple trend analysis - compare first half vs second half
    const firstHalf = recentHistory.slice(0, Math.floor(recentHistory.length / 2));
    const secondHalf = recentHistory.slice(Math.floor(recentHistory.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, h) => sum + h.accuracy, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, h) => sum + h.accuracy, 0) / secondHalf.length;
    
    return secondAvg > firstAvg;
  }

  /**
   * Generate recommendations for the student
   */
  generateRecommendations(adaptiveData, metrics) {
    const recommendations = [];
    
    // Accuracy recommendations
    if (metrics.accuracy < 0.7) {
      recommendations.push({
        type: 'accuracy',
        priority: 'high',
        message: 'ركز على الدقة أكثر من السرعة. خذ وقتك في التفكير قبل الإجابة.',
        action: 'practice_accuracy'
      });
    }
    
    // Speed recommendations
    if (metrics.averageTime > 45) {
      recommendations.push({
        type: 'speed',
        priority: 'medium',
        message: 'حاول تحسين سرعة الإجابة من خلال ممارسة التمارين الأساسية.',
        action: 'practice_speed'
      });
    }
    
    // Consistency recommendations
    if (metrics.consistency < 0.6) {
      recommendations.push({
        type: 'consistency',
        priority: 'medium',
        message: 'اعمل على تحسين الثبات في الأداء من خلال التدريب المنتظم.',
        action: 'practice_consistency'
      });
    }
    
    // Weakness area recommendations
    if (adaptiveData.weaknessAreas.length > 0) {
      recommendations.push({
        type: 'weakness',
        priority: 'high',
        message: `ركز على تحسين أداءك في: ${adaptiveData.weaknessAreas.join('، ')}`,
        action: 'practice_weakness',
        areas: adaptiveData.weaknessAreas
      });
    }
    
    return recommendations;
  }

  /**
   * Utility functions
   */
  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  identifyErrorPatterns(exercises) {
    const patterns = [];
    let consecutiveErrors = 0;
    
    exercises.forEach((ex, index) => {
      if (!ex.isCorrect) {
        consecutiveErrors++;
      } else {
        if (consecutiveErrors >= 2) {
          patterns.push({
            type: 'consecutive_errors',
            count: consecutiveErrors,
            startIndex: index - consecutiveErrors
          });
        }
        consecutiveErrors = 0;
      }
    });
    
    return patterns;
  }

  analyzeSpeedTrend(exercises) {
    if (exercises.length < 3) return 'insufficient_data';
    
    const times = exercises.map(ex => ex.timeSpent || 0);
    const firstHalf = times.slice(0, Math.floor(times.length / 2));
    const secondHalf = times.slice(Math.floor(times.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, time) => sum + time, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, time) => sum + time, 0) / secondHalf.length;
    
    const difference = (firstAvg - secondAvg) / firstAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  getAdaptationReason(metrics) {
    if (metrics.accuracy > 0.85) return 'high_accuracy';
    if (metrics.accuracy < 0.65) return 'low_accuracy';
    if (metrics.averageTime < 20) return 'very_fast';
    if (metrics.averageTime > 60) return 'too_slow';
    return 'balanced_adjustment';
  }

  getRecommendationReasoning(adaptiveData, recommendations) {
    return {
      difficultyLevel: `مستوى الصعوبة الحالي: ${Math.round(adaptiveData.difficultyScore * 100)}%`,
      learningStyle: `نمط التعلم المفضل: ${adaptiveData.learningStyle}`,
      strengths: `نقاط القوة: ${adaptiveData.strengthAreas.join('، ') || 'لا توجد بيانات كافية'}`,
      improvements: `مجالات التحسين: ${adaptiveData.weaknessAreas.join('، ') || 'لا توجد مجالات محددة'}`
    };
  }
}

module.exports = AdaptiveLearningEngine;
