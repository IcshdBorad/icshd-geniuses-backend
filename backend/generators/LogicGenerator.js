/**
 * Logic Math Generator for ICSHD GENIUSES
 * Generates mathematical logic and reasoning exercises for different grade levels
 */

class LogicGenerator {
  constructor() {
    this.gradeLevels = {
      'L1': { // 1st-2nd Grade
        name: 'الأول والثاني الابتدائي',
        ageRange: '6-8',
        topics: ['pattern_recognition', 'simple_sequences', 'basic_sorting', 'counting_logic', 'shape_patterns']
      },
      'L2': { // 3rd-4th Grade  
        name: 'الثالث والرابع الابتدائي',
        ageRange: '8-10',
        topics: ['number_patterns', 'word_problems', 'logical_sequences', 'basic_geometry', 'time_logic']
      },
      'L3': { // 5th-6th Grade
        name: 'الخامس والسادس الابتدائي', 
        ageRange: '10-12',
        topics: ['advanced_patterns', 'fraction_logic', 'measurement_reasoning', 'probability_basics', 'algebraic_thinking']
      },
      'L4': { // 7th-8th Grade (Middle School)
        name: 'الأول والثاني المتوسط',
        ageRange: '12-14', 
        topics: ['algebraic_logic', 'geometric_reasoning', 'statistical_thinking', 'equation_solving', 'logical_proofs']
      },
      'L5': { // 9th-10th Grade
        name: 'الثالث المتوسط والأول الثانوي',
        ageRange: '14-16',
        topics: ['advanced_algebra', 'trigonometry_logic', 'function_analysis', 'mathematical_modeling', 'logical_arguments']
      },
      'L6': { // 11th-12th Grade
        name: 'الثاني والثالث الثانوي',
        ageRange: '16-18',
        topics: ['calculus_concepts', 'advanced_geometry', 'complex_problem_solving', 'mathematical_proof', 'optimization']
      }
    };

    this.exerciseTypes = {
      'pattern_recognition': {
        name: 'التعرف على الأنماط',
        description: 'Identify and continue patterns',
        difficulty_levels: ['easy', 'medium', 'hard']
      },
      'logical_sequences': {
        name: 'المتتاليات المنطقية',
        description: 'Complete logical number or shape sequences',
        difficulty_levels: ['easy', 'medium', 'hard']
      },
      'word_problems': {
        name: 'المسائل اللفظية',
        description: 'Solve mathematical word problems',
        difficulty_levels: ['easy', 'medium', 'hard']
      },
      'geometric_reasoning': {
        name: 'الاستدلال الهندسي',
        description: 'Solve geometry-based logic problems',
        difficulty_levels: ['medium', 'hard']
      },
      'algebraic_logic': {
        name: 'المنطق الجبري',
        description: 'Apply logical thinking to algebraic concepts',
        difficulty_levels: ['medium', 'hard']
      }
    };

    this.usedExercises = new Set();
  }

  /**
   * Generate logic math exercises
   */
  generateExercises(config) {
    const {
      level = 'L1',
      count = 10,
      exerciseType = 'pattern_recognition',
      difficulty = 'medium',
      focusAreas = [],
      adaptiveData = null
    } = config;

    const exercises = [];
    const levelConfig = this.gradeLevels[level];

    if (!levelConfig) {
      throw new Error(`Invalid Logic level: ${level}`);
    }

    for (let i = 0; i < count; i++) {
      const selectedType = this.selectExerciseType(levelConfig, exerciseType, focusAreas, i);
      const exercise = this.generateSingleExercise(selectedType, level, difficulty);
      
      if (exercise && !this.isDuplicate(exercise)) {
        exercises.push(exercise);
        this.usedExercises.add(this.getExerciseSignature(exercise));
      } else {
        i--; // Retry
      }
    }

    return exercises;
  }

  /**
   * Generate single logic exercise
   */
  generateSingleExercise(exerciseType, level, difficulty) {
    switch (exerciseType) {
      case 'pattern_recognition':
        return this.generatePatternRecognition(level, difficulty);
      case 'logical_sequences':
        return this.generateLogicalSequence(level, difficulty);
      case 'word_problems':
        return this.generateWordProblem(level, difficulty);
      case 'geometric_reasoning':
        return this.generateGeometricReasoning(level, difficulty);
      case 'algebraic_logic':
        return this.generateAlgebraicLogic(level, difficulty);
      case 'simple_sequences':
        return this.generateSimpleSequence(level, difficulty);
      case 'counting_logic':
        return this.generateCountingLogic(level, difficulty);
      default:
        return this.generatePatternRecognition(level, difficulty);
    }
  }

  /**
   * Generate pattern recognition exercise
   */
  generatePatternRecognition(level, difficulty) {
    const patterns = this.getPatternsByLevel(level, difficulty);
    const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    const sequence = this.generatePatternSequence(selectedPattern, difficulty);
    const answer = this.getNextInPattern(sequence, selectedPattern);
    
    return {
      type: 'pattern_recognition',
      question: `ما هو الرقم التالي في هذا النمط؟\n${sequence.join(', ')}, ___`,
      sequence: sequence,
      pattern: selectedPattern,
      answer: answer,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'pattern'),
      hints: this.generatePatternHints(sequence, selectedPattern),
      explanation: this.generatePatternExplanation(sequence, selectedPattern, answer),
      visualAid: this.generatePatternVisual(sequence, selectedPattern)
    };
  }

  /**
   * Generate logical sequence exercise
   */
  generateLogicalSequence(level, difficulty) {
    const sequenceTypes = this.getSequenceTypesByLevel(level);
    const selectedType = sequenceTypes[Math.floor(Math.random() * sequenceTypes.length)];
    
    const sequence = this.generateSequence(selectedType, difficulty);
    const missingIndex = Math.floor(sequence.length / 2); // Missing element in middle
    const answer = sequence[missingIndex];
    const questionSequence = [...sequence];
    questionSequence[missingIndex] = '___';
    
    return {
      type: 'logical_sequences',
      question: `أكمل المتتالية:\n${questionSequence.join(', ')}`,
      sequence: questionSequence,
      fullSequence: sequence,
      missingIndex: missingIndex,
      answer: answer,
      sequenceType: selectedType,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'sequence'),
      hints: this.generateSequenceHints(sequence, selectedType, missingIndex),
      explanation: this.generateSequenceExplanation(sequence, selectedType, answer),
      rule: this.getSequenceRule(selectedType)
    };
  }

  /**
   * Generate word problem exercise
   */
  generateWordProblem(level, difficulty) {
    const problemTypes = this.getWordProblemTypes(level);
    const selectedType = problemTypes[Math.floor(Math.random() * problemTypes.length)];
    
    const problem = this.generateWordProblemByType(selectedType, level, difficulty);
    
    return {
      type: 'word_problems',
      question: problem.question,
      problemType: selectedType,
      answer: problem.answer,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'word_problem'),
      hints: problem.hints,
      explanation: problem.explanation,
      steps: problem.steps,
      context: problem.context
    };
  }

  /**
   * Generate simple sequence for early grades
   */
  generateSimpleSequence(level, difficulty) {
    const sequenceLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
    const increment = difficulty === 'easy' ? 
      Math.floor(Math.random() * 3) + 1 : // 1-3
      Math.floor(Math.random() * 5) + 1;  // 1-5
    
    const start = Math.floor(Math.random() * 10) + 1;
    const sequence = [];
    
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push(start + (i * increment));
    }
    
    const nextNumber = start + (sequenceLength * increment);
    
    return {
      type: 'simple_sequences',
      question: `ما هو الرقم التالي؟\n${sequence.join(', ')}, ___`,
      sequence: sequence,
      increment: increment,
      answer: nextNumber,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'simple_sequence'),
      hints: [
        {
          level: 1,
          text: `انظر إلى الفرق بين الأرقام`,
          pointsDeduction: 1
        },
        {
          level: 2,
          text: `كل رقم يزيد بـ ${increment}`,
          pointsDeduction: 2
        }
      ],
      explanation: {
        text: 'شرح المتتالية:',
        steps: [
          `البداية: ${start}`,
          `كل رقم يزيد بـ ${increment}`,
          `${start} + ${increment} = ${start + increment}`,
          `${start + increment} + ${increment} = ${start + (2 * increment)}`,
          `الرقم التالي: ${nextNumber}`
        ]
      }
    };
  }

  /**
   * Generate counting logic exercise
   */
  generateCountingLogic(level, difficulty) {
    const scenarios = [
      'counting_objects',
      'counting_by_groups',
      'skip_counting',
      'counting_backwards'
    ];
    
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    switch (scenario) {
      case 'counting_objects':
        return this.generateObjectCounting(difficulty);
      case 'counting_by_groups':
        return this.generateGroupCounting(difficulty);
      case 'skip_counting':
        return this.generateSkipCounting(difficulty);
      case 'counting_backwards':
        return this.generateBackwardsCounting(difficulty);
      default:
        return this.generateObjectCounting(difficulty);
    }
  }

  /**
   * Helper methods for generating specific exercise types
   */
  generateObjectCounting(difficulty) {
    const maxObjects = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
    const objectCount = Math.floor(Math.random() * maxObjects) + 1;
    const objects = ['تفاحات', 'كتب', 'أقلام', 'كرات', 'زهور'];
    const selectedObject = objects[Math.floor(Math.random() * objects.length)];
    
    return {
      type: 'counting_logic',
      subtype: 'object_counting',
      question: `إذا كان لديك ${objectCount} ${selectedObject}، وأعطيت صديقك ${Math.floor(objectCount / 3)}، كم ${selectedObject} تبقى معك؟`,
      totalObjects: objectCount,
      givenAway: Math.floor(objectCount / 3),
      answer: objectCount - Math.floor(objectCount / 3),
      difficulty: difficulty,
      timeLimit: this.calculateTimeLimit(difficulty, 'counting'),
      hints: [
        {
          level: 1,
          text: 'هذه مسألة طرح بسيطة',
          pointsDeduction: 1
        }
      ],
      explanation: {
        text: 'شرح الحل:',
        steps: [
          `العدد الأصلي: ${objectCount}`,
          `المُعطى: ${Math.floor(objectCount / 3)}`,
          `المتبقي: ${objectCount} - ${Math.floor(objectCount / 3)} = ${objectCount - Math.floor(objectCount / 3)}`
        ]
      }
    };
  }

  /**
   * Pattern generation helpers
   */
  getPatternsByLevel(level, difficulty) {
    const basePatterns = ['arithmetic', 'geometric', 'fibonacci'];
    
    switch (level) {
      case 'L1':
      case 'L2':
        return ['arithmetic']; // Simple addition patterns
      case 'L3':
      case 'L4':
        return ['arithmetic', 'geometric'];
      case 'L5':
      case 'L6':
        return ['arithmetic', 'geometric', 'fibonacci', 'polynomial'];
      default:
        return ['arithmetic'];
    }
  }

  generatePatternSequence(patternType, difficulty) {
    const length = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 5 : 6;
    
    switch (patternType) {
      case 'arithmetic':
        return this.generateArithmeticSequence(length, difficulty);
      case 'geometric':
        return this.generateGeometricSequence(length, difficulty);
      case 'fibonacci':
        return this.generateFibonacciSequence(length);
      default:
        return this.generateArithmeticSequence(length, difficulty);
    }
  }

  generateArithmeticSequence(length, difficulty) {
    const start = Math.floor(Math.random() * 10) + 1;
    const diff = difficulty === 'easy' ? 
      Math.floor(Math.random() * 3) + 1 :
      Math.floor(Math.random() * 7) + 1;
    
    const sequence = [];
    for (let i = 0; i < length; i++) {
      sequence.push(start + (i * diff));
    }
    return sequence;
  }

  generateGeometricSequence(length, difficulty) {
    const start = difficulty === 'easy' ? 1 : Math.floor(Math.random() * 3) + 1;
    const ratio = difficulty === 'easy' ? 2 : Math.floor(Math.random() * 3) + 2;
    
    const sequence = [];
    for (let i = 0; i < length; i++) {
      sequence.push(start * Math.pow(ratio, i));
    }
    return sequence;
  }

  generateFibonacciSequence(length) {
    const sequence = [1, 1];
    for (let i = 2; i < length; i++) {
      sequence.push(sequence[i-1] + sequence[i-2]);
    }
    return sequence;
  }

  getNextInPattern(sequence, patternType) {
    switch (patternType) {
      case 'arithmetic':
        const diff = sequence[1] - sequence[0];
        return sequence[sequence.length - 1] + diff;
      case 'geometric':
        const ratio = sequence[1] / sequence[0];
        return sequence[sequence.length - 1] * ratio;
      case 'fibonacci':
        return sequence[sequence.length - 1] + sequence[sequence.length - 2];
      default:
        return sequence[sequence.length - 1] + 1;
    }
  }

  /**
   * Utility methods
   */
  calculateTimeLimit(difficulty, type) {
    let baseTime = 30; // seconds
    
    switch (type) {
      case 'pattern': baseTime = 45; break;
      case 'sequence': baseTime = 40; break;
      case 'word_problem': baseTime = 60; break;
      case 'simple_sequence': baseTime = 30; break;
      case 'counting': baseTime = 35; break;
    }
    
    switch (difficulty) {
      case 'easy': return Math.floor(baseTime * 1.5);
      case 'medium': return baseTime;
      case 'hard': return Math.floor(baseTime * 0.8);
      default: return baseTime;
    }
  }

  selectExerciseType(levelConfig, exerciseType, focusAreas, index) {
    if (focusAreas.length > 0) {
      return focusAreas[index % focusAreas.length];
    }
    
    const availableTopics = levelConfig.topics;
    return availableTopics[Math.floor(Math.random() * availableTopics.length)];
  }

  isDuplicate(exercise) {
    return this.usedExercises.has(this.getExerciseSignature(exercise));
  }

  getExerciseSignature(exercise) {
    return `${exercise.type}_${exercise.question.substring(0, 50)}`;
  }

  // Placeholder methods for more complex exercise types
  generatePatternHints(sequence, patternType) {
    return [
      {
        level: 1,
        text: 'انظر إلى العلاقة بين الأرقام المتتالية',
        pointsDeduction: 1
      }
    ];
  }

  generatePatternExplanation(sequence, patternType, answer) {
    return {
      text: 'شرح النمط:',
      steps: [`النمط: ${patternType}`, `الإجابة: ${answer}`]
    };
  }

  generatePatternVisual(sequence, patternType) {
    return {
      type: 'number_line',
      data: sequence
    };
  }

  getSequenceTypesByLevel(level) {
    return ['arithmetic', 'counting'];
  }

  generateSequence(type, difficulty) {
    return this.generateArithmeticSequence(5, difficulty);
  }

  generateSequenceHints(sequence, type, missingIndex) {
    return [
      {
        level: 1,
        text: 'ابحث عن القاعدة في المتتالية',
        pointsDeduction: 1
      }
    ];
  }

  generateSequenceExplanation(sequence, type, answer) {
    return {
      text: 'شرح المتتالية:',
      steps: [`النوع: ${type}`, `الإجابة: ${answer}`]
    };
  }

  getSequenceRule(type) {
    return `قاعدة ${type}`;
  }

  getWordProblemTypes(level) {
    return ['addition_story', 'subtraction_story'];
  }

  generateWordProblemByType(type, level, difficulty) {
    return {
      question: 'مسألة لفظية بسيطة',
      answer: 10,
      hints: [],
      explanation: { text: 'شرح', steps: [] },
      steps: [],
      context: 'رياضيات'
    };
  }
}

module.exports = LogicGenerator;
