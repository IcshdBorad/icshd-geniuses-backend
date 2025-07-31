/**
 * Adaptive Exercise Generator for ICSHD GENIUSES
 * Generates personalized exercises based on student performance and learning patterns
 */

const Exercise = require('../models/Exercise');
const ExerciseGenerator = require('./ExerciseGenerator');

class AdaptiveExerciseGenerator extends ExerciseGenerator {
  constructor() {
    super();
    
    // Difficulty progression curves for different curricula
    this.difficultyProgression = {
      soroban: {
        1: { range: [1, 10], operations: ['addition'], digits: 1 },
        2: { range: [1, 50], operations: ['addition', 'subtraction'], digits: 2 },
        3: { range: [1, 100], operations: ['addition', 'subtraction'], digits: 2 },
        4: { range: [1, 500], operations: ['addition', 'subtraction', 'multiplication'], digits: 3 },
        5: { range: [1, 1000], operations: ['addition', 'subtraction', 'multiplication'], digits: 3 },
        6: { range: [1, 5000], operations: ['addition', 'subtraction', 'multiplication', 'division'], digits: 4 },
        7: { range: [1, 10000], operations: ['addition', 'subtraction', 'multiplication', 'division'], digits: 4 },
        8: { range: [1, 50000], operations: ['mixed'], digits: 5 },
        9: { range: [1, 100000], operations: ['mixed'], digits: 5 },
        10: { range: [1, 1000000], operations: ['mixed'], digits: 6 }
      },
      vedic: {
        1: { techniques: ['basic_multiplication'], range: [1, 20] },
        2: { techniques: ['basic_multiplication', 'squares'], range: [1, 50] },
        3: { techniques: ['multiplication_11', 'squares'], range: [1, 100] },
        4: { techniques: ['multiplication_11', 'squares', 'cubes'], range: [1, 200] },
        5: { techniques: ['all_from_9', 'squares', 'cubes'], range: [1, 500] },
        6: { techniques: ['vertically_crosswise', 'division'], range: [1, 1000] },
        7: { techniques: ['advanced_multiplication', 'division'], range: [1, 2000] },
        8: { techniques: ['complex_operations'], range: [1, 5000] },
        9: { techniques: ['expert_techniques'], range: [1, 10000] },
        10: { techniques: ['master_level'], range: [1, 100000] }
      },
      logic: {
        1: { types: ['pattern_simple'], complexity: 1 },
        2: { types: ['pattern_simple', 'sequence'], complexity: 2 },
        3: { types: ['pattern_medium', 'sequence'], complexity: 2 },
        4: { types: ['pattern_medium', 'sequence', 'logic_basic'], complexity: 3 },
        5: { types: ['pattern_complex', 'logic_basic'], complexity: 3 },
        6: { types: ['pattern_complex', 'logic_medium'], complexity: 4 },
        7: { types: ['logic_medium', 'reasoning'], complexity: 4 },
        8: { types: ['logic_complex', 'reasoning'], complexity: 5 },
        9: { types: ['advanced_reasoning'], complexity: 5 },
        10: { types: ['expert_logic'], complexity: 6 }
      },
      iqgames: {
        1: { games: ['memory_basic'], difficulty: 1 },
        2: { games: ['memory_basic', 'attention'], difficulty: 2 },
        3: { games: ['memory_medium', 'attention'], difficulty: 2 },
        4: { games: ['memory_medium', 'spatial'], difficulty: 3 },
        5: { games: ['memory_complex', 'spatial'], difficulty: 3 },
        6: { games: ['spatial_complex', 'reasoning'], difficulty: 4 },
        7: { games: ['reasoning', 'creativity'], difficulty: 4 },
        8: { games: ['advanced_reasoning', 'creativity'], difficulty: 5 },
        9: { games: ['expert_games'], difficulty: 5 },
        10: { games: ['master_challenges'], difficulty: 6 }
      }
    };

    // Learning style adaptations
    this.learningStyleAdaptations = {
      visual: {
        preferredFormats: ['image', 'diagram', 'chart'],
        avoidFormats: ['text_only'],
        enhancementFactors: { visual: 1.5, interactive: 1.2 }
      },
      auditory: {
        preferredFormats: ['audio', 'verbal'],
        avoidFormats: ['silent'],
        enhancementFactors: { audio: 1.5, rhythm: 1.3 }
      },
      kinesthetic: {
        preferredFormats: ['interactive', 'hands_on'],
        avoidFormats: ['static'],
        enhancementFactors: { interactive: 1.5, movement: 1.4 }
      },
      mixed: {
        preferredFormats: ['varied'],
        avoidFormats: [],
        enhancementFactors: { balanced: 1.2 }
      }
    };
  }

  /**
   * Generate adaptive exercise set based on student profile
   */
  async generateAdaptiveSet(curriculum, level, count, adaptiveProfile) {
    try {
      const {
        targetDifficulty,
        preferredTypes,
        avoidTypes,
        learningStyle,
        focusAreas,
        weaknessAreas,
        strengthAreas
      } = adaptiveProfile;

      const exercises = [];
      const progression = this.difficultyProgression[curriculum][level];
      
      if (!progression) {
        throw new Error(`No progression defined for ${curriculum} level ${level}`);
      }

      // Calculate exercise distribution
      const distribution = this.calculateExerciseDistribution(
        count, 
        preferredTypes, 
        focusAreas, 
        weaknessAreas
      );

      // Generate exercises for each type in distribution
      for (const [exerciseType, typeCount] of Object.entries(distribution)) {
        if (typeCount > 0 && !avoidTypes.includes(exerciseType)) {
          const typeExercises = await this.generateTypeSpecificExercises(
            curriculum,
            exerciseType,
            typeCount,
            level,
            targetDifficulty,
            learningStyle,
            progression
          );
          exercises.push(...typeExercises);
        }
      }

      // Fill remaining slots with balanced exercises
      const remaining = count - exercises.length;
      if (remaining > 0) {
        const balancedExercises = await this.generateBalancedExercises(
          curriculum,
          remaining,
          level,
          targetDifficulty,
          learningStyle,
          progression
        );
        exercises.push(...balancedExercises);
      }

      // Shuffle and apply final adaptations
      const adaptedExercises = this.applyLearningStyleAdaptations(
        this.shuffleArray(exercises.slice(0, count)),
        learningStyle
      );

      return adaptedExercises;
    } catch (error) {
      console.error('Error generating adaptive exercise set:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal distribution of exercise types
   */
  calculateExerciseDistribution(count, preferredTypes, focusAreas, weaknessAreas) {
    const distribution = {};
    
    // Allocate 40% to focus areas (weakness improvement)
    const focusCount = Math.floor(count * 0.4);
    if (focusAreas && focusAreas.length > 0) {
      const perFocus = Math.floor(focusCount / focusAreas.length);
      focusAreas.forEach(area => {
        distribution[area] = perFocus;
      });
    }

    // Allocate 30% to preferred types (strength reinforcement)
    const preferredCount = Math.floor(count * 0.3);
    if (preferredTypes && preferredTypes.length > 0) {
      const perPreferred = Math.floor(preferredCount / preferredTypes.length);
      preferredTypes.forEach(type => {
        distribution[type] = (distribution[type] || 0) + perPreferred;
      });
    }

    // Allocate 20% to weakness areas (targeted improvement)
    const weaknessCount = Math.floor(count * 0.2);
    if (weaknessAreas && weaknessAreas.length > 0) {
      const perWeakness = Math.floor(weaknessCount / weaknessAreas.length);
      weaknessAreas.forEach(area => {
        distribution[area] = (distribution[area] || 0) + perWeakness;
      });
    }

    // Remaining 10% for exploration/variety
    const explorationCount = count - Object.values(distribution).reduce((sum, val) => sum + val, 0);
    if (explorationCount > 0) {
      distribution['mixed'] = explorationCount;
    }

    return distribution;
  }

  /**
   * Generate exercises for specific type
   */
  async generateTypeSpecificExercises(curriculum, exerciseType, count, level, targetDifficulty, learningStyle, progression) {
    const exercises = [];
    
    for (let i = 0; i < count; i++) {
      let exercise;
      
      switch (curriculum) {
        case 'soroban':
          exercise = await this.generateSorobanExercise(exerciseType, level, targetDifficulty, progression);
          break;
        case 'vedic':
          exercise = await this.generateVedicExercise(exerciseType, level, targetDifficulty, progression);
          break;
        case 'logic':
          exercise = await this.generateLogicExercise(exerciseType, level, targetDifficulty, progression);
          break;
        case 'iqgames':
          exercise = await this.generateIQGameExercise(exerciseType, level, targetDifficulty, progression);
          break;
        default:
          throw new Error(`Unknown curriculum: ${curriculum}`);
      }

      if (exercise) {
        exercises.push(exercise);
      }
    }

    return exercises;
  }

  /**
   * Generate Soroban exercises with adaptive difficulty
   */
  async generateSorobanExercise(type, level, targetDifficulty, progression) {
    const { range, operations, digits } = progression;
    const adjustedRange = this.adjustRangeForDifficulty(range, targetDifficulty);
    
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    let question, answer, steps;
    
    switch (operation) {
      case 'addition':
        ({ question, answer, steps } = this.generateAdditionProblem(adjustedRange, digits));
        break;
      case 'subtraction':
        ({ question, answer, steps } = this.generateSubtractionProblem(adjustedRange, digits));
        break;
      case 'multiplication':
        ({ question, answer, steps } = this.generateMultiplicationProblem(adjustedRange, digits));
        break;
      case 'division':
        ({ question, answer, steps } = this.generateDivisionProblem(adjustedRange, digits));
        break;
      case 'mixed':
        ({ question, answer, steps } = this.generateMixedProblem(adjustedRange, digits));
        break;
    }

    return {
      curriculum: 'soroban',
      type: operation,
      level,
      difficulty: Math.round(targetDifficulty * 5),
      question,
      answer,
      steps,
      timeLimit: this.calculateTimeLimit(targetDifficulty, operation),
      hint: this.generateSorobanHint(operation, question),
      metadata: {
        operation,
        digits,
        range: adjustedRange,
        adaptiveDifficulty: targetDifficulty
      }
    };
  }

  /**
   * Generate Vedic Math exercises
   */
  async generateVedicExercise(type, level, targetDifficulty, progression) {
    const { techniques, range } = progression;
    const adjustedRange = this.adjustRangeForDifficulty(range, targetDifficulty);
    
    const technique = techniques[Math.floor(Math.random() * techniques.length)];
    
    let question, answer, steps, vedicMethod;
    
    switch (technique) {
      case 'basic_multiplication':
        ({ question, answer, steps, vedicMethod } = this.generateBasicVedicMultiplication(adjustedRange));
        break;
      case 'squares':
        ({ question, answer, steps, vedicMethod } = this.generateVedicSquares(adjustedRange));
        break;
      case 'multiplication_11':
        ({ question, answer, steps, vedicMethod } = this.generateMultiplicationBy11(adjustedRange));
        break;
      case 'all_from_9':
        ({ question, answer, steps, vedicMethod } = this.generateAllFrom9(adjustedRange));
        break;
      case 'vertically_crosswise':
        ({ question, answer, steps, vedicMethod } = this.generateVerticallyCrosswise(adjustedRange));
        break;
      default:
        ({ question, answer, steps, vedicMethod } = this.generateBasicVedicMultiplication(adjustedRange));
    }

    return {
      curriculum: 'vedic',
      type: technique,
      level,
      difficulty: Math.round(targetDifficulty * 5),
      question,
      answer,
      steps,
      vedicMethod,
      timeLimit: this.calculateTimeLimit(targetDifficulty, 'vedic'),
      hint: this.generateVedicHint(technique, question),
      metadata: {
        technique,
        range: adjustedRange,
        adaptiveDifficulty: targetDifficulty
      }
    };
  }

  /**
   * Generate Logic exercises
   */
  async generateLogicExercise(type, level, targetDifficulty, progression) {
    const { types, complexity } = progression;
    const adjustedComplexity = Math.round(complexity * targetDifficulty);
    
    const logicType = types[Math.floor(Math.random() * types.length)];
    
    let question, answer, pattern, explanation;
    
    switch (logicType) {
      case 'pattern_simple':
        ({ question, answer, pattern, explanation } = this.generateSimplePattern(adjustedComplexity));
        break;
      case 'pattern_medium':
        ({ question, answer, pattern, explanation } = this.generateMediumPattern(adjustedComplexity));
        break;
      case 'pattern_complex':
        ({ question, answer, pattern, explanation } = this.generateComplexPattern(adjustedComplexity));
        break;
      case 'sequence':
        ({ question, answer, pattern, explanation } = this.generateSequence(adjustedComplexity));
        break;
      case 'logic_basic':
        ({ question, answer, pattern, explanation } = this.generateBasicLogic(adjustedComplexity));
        break;
      case 'reasoning':
        ({ question, answer, pattern, explanation } = this.generateReasoning(adjustedComplexity));
        break;
      default:
        ({ question, answer, pattern, explanation } = this.generateSimplePattern(adjustedComplexity));
    }

    return {
      curriculum: 'logic',
      type: logicType,
      level,
      difficulty: Math.round(targetDifficulty * 5),
      question,
      answer,
      pattern,
      explanation,
      timeLimit: this.calculateTimeLimit(targetDifficulty, 'logic'),
      hint: this.generateLogicHint(logicType, pattern),
      metadata: {
        logicType,
        complexity: adjustedComplexity,
        adaptiveDifficulty: targetDifficulty
      }
    };
  }

  /**
   * Generate IQ Game exercises
   */
  async generateIQGameExercise(type, level, targetDifficulty, progression) {
    const { games, difficulty } = progression;
    const adjustedDifficulty = Math.round(difficulty * targetDifficulty);
    
    const gameType = games[Math.floor(Math.random() * games.length)];
    
    let question, answer, gameData, instructions;
    
    switch (gameType) {
      case 'memory_basic':
        ({ question, answer, gameData, instructions } = this.generateBasicMemoryGame(adjustedDifficulty));
        break;
      case 'memory_medium':
        ({ question, answer, gameData, instructions } = this.generateMediumMemoryGame(adjustedDifficulty));
        break;
      case 'attention':
        ({ question, answer, gameData, instructions } = this.generateAttentionGame(adjustedDifficulty));
        break;
      case 'spatial':
        ({ question, answer, gameData, instructions } = this.generateSpatialGame(adjustedDifficulty));
        break;
      case 'reasoning':
        ({ question, answer, gameData, instructions } = this.generateReasoningGame(adjustedDifficulty));
        break;
      default:
        ({ question, answer, gameData, instructions } = this.generateBasicMemoryGame(adjustedDifficulty));
    }

    return {
      curriculum: 'iqgames',
      type: gameType,
      level,
      difficulty: Math.round(targetDifficulty * 5),
      question,
      answer,
      gameData,
      instructions,
      timeLimit: this.calculateTimeLimit(targetDifficulty, 'iqgames'),
      hint: this.generateIQGameHint(gameType, gameData),
      metadata: {
        gameType,
        difficulty: adjustedDifficulty,
        adaptiveDifficulty: targetDifficulty
      }
    };
  }

  /**
   * Apply learning style adaptations
   */
  applyLearningStyleAdaptations(exercises, learningStyle) {
    const adaptations = this.learningStyleAdaptations[learningStyle] || this.learningStyleAdaptations.mixed;
    
    return exercises.map(exercise => {
      const adapted = { ...exercise };
      
      // Apply format preferences
      if (adaptations.preferredFormats.includes('image')) {
        adapted.metadata.hasImage = true;
        adapted.metadata.visualEnhanced = true;
      }
      
      if (adaptations.preferredFormats.includes('audio')) {
        adapted.metadata.hasAudio = true;
        adapted.metadata.audioEnhanced = true;
      }
      
      if (adaptations.preferredFormats.includes('interactive')) {
        adapted.metadata.isInteractive = true;
        adapted.metadata.interactiveEnhanced = true;
      }
      
      // Adjust time limits based on learning style
      if (learningStyle === 'kinesthetic') {
        adapted.timeLimit = Math.round(adapted.timeLimit * 1.2); // More time for hands-on learners
      } else if (learningStyle === 'visual') {
        adapted.timeLimit = Math.round(adapted.timeLimit * 1.1); // Slightly more time for visual processing
      }
      
      return adapted;
    });
  }

  /**
   * Utility functions for exercise generation
   */
  adjustRangeForDifficulty(baseRange, targetDifficulty) {
    const [min, max] = baseRange;
    const range = max - min;
    const adjustedRange = range * targetDifficulty;
    return [min, min + Math.round(adjustedRange)];
  }

  calculateTimeLimit(targetDifficulty, exerciseType) {
    const baseTimes = {
      addition: 30,
      subtraction: 35,
      multiplication: 45,
      division: 60,
      vedic: 40,
      logic: 90,
      iqgames: 60
    };
    
    const baseTime = baseTimes[exerciseType] || 45;
    
    // Adjust time based on difficulty (higher difficulty = more time)
    const difficultyMultiplier = 0.5 + (targetDifficulty * 1.5);
    return Math.round(baseTime * difficultyMultiplier);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Placeholder methods for specific exercise generation
  // These would be implemented with actual exercise logic
  
  generateAdditionProblem(range, digits) {
    const [min, max] = range;
    const a = Math.floor(Math.random() * (max - min) + min);
    const b = Math.floor(Math.random() * (max - min) + min);
    return {
      question: `${a} + ${b} = ?`,
      answer: a + b,
      steps: [`${a} + ${b}`, `= ${a + b}`]
    };
  }

  generateSubtractionProblem(range, digits) {
    const [min, max] = range;
    const a = Math.floor(Math.random() * (max - min) + min);
    const b = Math.floor(Math.random() * a); // Ensure positive result
    return {
      question: `${a} - ${b} = ?`,
      answer: a - b,
      steps: [`${a} - ${b}`, `= ${a - b}`]
    };
  }

  generateMultiplicationProblem(range, digits) {
    const [min, max] = range;
    const a = Math.floor(Math.random() * Math.sqrt(max - min) + min);
    const b = Math.floor(Math.random() * Math.sqrt(max - min) + min);
    return {
      question: `${a} × ${b} = ?`,
      answer: a * b,
      steps: [`${a} × ${b}`, `= ${a * b}`]
    };
  }

  generateDivisionProblem(range, digits) {
    const [min, max] = range;
    const b = Math.floor(Math.random() * 9 + 2); // Divisor 2-10
    const answer = Math.floor(Math.random() * (max / b - min / b) + min / b);
    const a = answer * b;
    return {
      question: `${a} ÷ ${b} = ?`,
      answer: answer,
      steps: [`${a} ÷ ${b}`, `= ${answer}`]
    };
  }

  generateMixedProblem(range, digits) {
    const operations = ['addition', 'subtraction', 'multiplication'];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    
    switch (operation) {
      case 'addition': return this.generateAdditionProblem(range, digits);
      case 'subtraction': return this.generateSubtractionProblem(range, digits);
      case 'multiplication': return this.generateMultiplicationProblem(range, digits);
      default: return this.generateAdditionProblem(range, digits);
    }
  }

  // Placeholder methods for other exercise types
  generateBasicVedicMultiplication(range) {
    const [min, max] = range;
    const a = Math.floor(Math.random() * (max - min) + min);
    const b = Math.floor(Math.random() * (max - min) + min);
    return {
      question: `${a} × ${b} = ? (استخدم الطريقة الفيدية)`,
      answer: a * b,
      steps: [`${a} × ${b}`, `= ${a * b}`],
      vedicMethod: 'الضرب الأساسي'
    };
  }

  generateVedicSquares(range) {
    const [min, max] = range;
    const a = Math.floor(Math.random() * (Math.sqrt(max) - Math.sqrt(min)) + Math.sqrt(min));
    return {
      question: `${a}² = ?`,
      answer: a * a,
      steps: [`${a}²`, `= ${a * a}`],
      vedicMethod: 'طريقة المربعات الفيدية'
    };
  }

  generateSimplePattern(complexity) {
    const sequence = [2, 4, 6, 8];
    return {
      question: `ما هو الرقم التالي في التسلسل: ${sequence.join(', ')}, ?`,
      answer: 10,
      pattern: 'زيادة بمقدار 2',
      explanation: 'كل رقم يزيد عن السابق بمقدار 2'
    };
  }

  generateBasicMemoryGame(difficulty) {
    const sequence = Array.from({length: difficulty + 2}, () => Math.floor(Math.random() * 9) + 1);
    return {
      question: `احفظ هذا التسلسل: ${sequence.join(' - ')}`,
      answer: sequence.join(''),
      gameData: { sequence, displayTime: 3000 },
      instructions: 'احفظ التسلسل ثم أدخله'
    };
  }

  // Hint generation methods
  generateSorobanHint(operation, question) {
    const hints = {
      addition: 'ابدأ من اليمين واستخدم الخرز لتمثيل الأرقام',
      subtraction: 'تذكر قواعد الاستعارة في السوروبان',
      multiplication: 'قسم العملية إلى خطوات أصغر',
      division: 'استخدم طريقة القسمة المطولة'
    };
    return hints[operation] || 'خذ وقتك وفكر بهدوء';
  }

  generateVedicHint(technique, question) {
    const hints = {
      basic_multiplication: 'استخدم طريقة الضرب العمودي والأفقي',
      squares: 'استخدم قاعدة (a+b)(a-b) = a²-b²',
      multiplication_11: 'اجمع الرقمين المتجاورين'
    };
    return hints[technique] || 'تذكر القواعد الفيدية الأساسية';
  }

  generateLogicHint(type, pattern) {
    const hints = {
      pattern_simple: 'ابحث عن النمط في الفرق بين الأرقام',
      sequence: 'حدد القاعدة الرياضية المستخدمة',
      logic_basic: 'استخدم المنطق خطوة بخطوة'
    };
    return hints[type] || 'فكر في العلاقة بين العناصر';
  }

  generateIQGameHint(gameType, gameData) {
    const hints = {
      memory_basic: 'ركز على التسلسل وكرره في ذهنك',
      attention: 'ركز على التفاصيل المهمة',
      spatial: 'تخيل الشكل في الفضاء'
    };
    return hints[gameType] || 'ركز وخذ وقتك';
  }

  // Additional placeholder methods for completeness
  generateMediumPattern(complexity) { return this.generateSimplePattern(complexity); }
  generateComplexPattern(complexity) { return this.generateSimplePattern(complexity); }
  generateSequence(complexity) { return this.generateSimplePattern(complexity); }
  generateBasicLogic(complexity) { return this.generateSimplePattern(complexity); }
  generateReasoning(complexity) { return this.generateSimplePattern(complexity); }
  generateMultiplicationBy11(range) { return this.generateBasicVedicMultiplication(range); }
  generateAllFrom9(range) { return this.generateBasicVedicMultiplication(range); }
  generateVerticallyCrosswise(range) { return this.generateBasicVedicMultiplication(range); }
  generateMediumMemoryGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
  generateAttentionGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
  generateSpatialGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
  generateReasoningGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
  generateBalancedExercises(curriculum, count, level, targetDifficulty, learningStyle, progression) {
    return this.generateTypeSpecificExercises(curriculum, 'mixed', count, level, targetDifficulty, learningStyle, progression);
  }
}

module.exports = AdaptiveExerciseGenerator;
