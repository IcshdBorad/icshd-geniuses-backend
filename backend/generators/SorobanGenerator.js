/**
 * Soroban Exercise Generator for ICSHD GENIUSES
 * Generates intelligent Soroban exercises based on level, age group, and learning patterns
 */

class SorobanGenerator {
  constructor() {
    this.levels = {
      'A1': { digits: 1, rows: 1, operations: ['addition', 'subtraction'] },
      'A2': { digits: 1, rows: 2, operations: ['addition', 'subtraction'] },
      'A3': { digits: 2, rows: 2, operations: ['addition', 'subtraction'] },
      'B1': { digits: 2, rows: 3, operations: ['addition', 'subtraction', 'friends_of_5'] },
      'B2': { digits: 2, rows: 4, operations: ['addition', 'subtraction', 'friends_of_5'] },
      'B3': { digits: 3, rows: 4, operations: ['addition', 'subtraction', 'friends_of_5'] },
      'C1': { digits: 3, rows: 5, operations: ['addition', 'subtraction', 'friends_of_5', 'friends_of_10'] },
      'C2': { digits: 3, rows: 6, operations: ['addition', 'subtraction', 'friends_of_5', 'friends_of_10'] },
      'C3': { digits: 4, rows: 6, operations: ['addition', 'subtraction', 'friends_of_5', 'friends_of_10'] },
      'D1': { digits: 4, rows: 7, operations: ['addition', 'subtraction', 'friends_of_5', 'friends_of_10', 'mixed'] },
      'D2': { digits: 4, rows: 8, operations: ['addition', 'subtraction', 'friends_of_5', 'friends_of_10', 'mixed'] },
      'D3': { digits: 5, rows: 8, operations: ['addition', 'subtraction', 'friends_of_5', 'friends_of_10', 'mixed'] }
    };

    // Friends of 5 combinations
    this.friendsOf5 = [
      { a: 1, b: 4 }, { a: 2, b: 3 }, { a: 3, b: 2 }, { a: 4, b: 1 }
    ];

    // Friends of 10 combinations
    this.friendsOf10 = [
      { a: 1, b: 9 }, { a: 2, b: 8 }, { a: 3, b: 7 }, { a: 4, b: 6 },
      { a: 5, b: 5 }, { a: 6, b: 4 }, { a: 7, b: 3 }, { a: 8, b: 2 }, { a: 9, b: 1 }
    ];

    this.usedExercises = new Set(); // Prevent immediate repetition
  }

  /**
   * Generate a set of Soroban exercises
   * @param {Object} config - Configuration object
   * @returns {Array} Array of generated exercises
   */
  generateExercises(config) {
    const {
      level = 'A1',
      ageGroup = '7_to_10',
      count = 10,
      exerciseType = 'simple_addition',
      difficulty = 'medium',
      focusAreas = [],
      avoidPatterns = [],
      adaptiveData = null
    } = config;

    const exercises = [];
    const levelConfig = this.levels[level];

    if (!levelConfig) {
      throw new Error(`Invalid Soroban level: ${level}`);
    }

    // Determine exercise distribution based on level and focus areas
    const distribution = this.getExerciseDistribution(levelConfig, exerciseType, focusAreas);

    for (let i = 0; i < count; i++) {
      const exerciseConfig = this.selectExerciseType(distribution, i, count);
      const exercise = this.generateSingleExercise(exerciseConfig, levelConfig, ageGroup, difficulty);
      
      if (exercise && !this.isDuplicate(exercise)) {
        exercises.push(exercise);
        this.usedExercises.add(this.getExerciseSignature(exercise));
      } else {
        // Retry with different parameters
        i--;
      }
    }

    // Clear used exercises cache if it gets too large
    if (this.usedExercises.size > 1000) {
      this.usedExercises.clear();
    }

    return exercises;
  }

  /**
   * Generate a single Soroban exercise
   */
  generateSingleExercise(exerciseConfig, levelConfig, ageGroup, difficulty) {
    const { type, digits, rows } = exerciseConfig;

    switch (type) {
      case 'simple_addition':
        return this.generateSimpleAddition(digits, rows, difficulty);
      case 'simple_subtraction':
        return this.generateSimpleSubtraction(digits, rows, difficulty);
      case 'friends_of_5_addition':
        return this.generateFriendsOf5Addition(digits, rows, difficulty);
      case 'friends_of_5_subtraction':
        return this.generateFriendsOf5Subtraction(digits, rows, difficulty);
      case 'friends_of_10_addition':
        return this.generateFriendsOf10Addition(digits, rows, difficulty);
      case 'friends_of_10_subtraction':
        return this.generateFriendsOf10Subtraction(digits, rows, difficulty);
      case 'mixed_operations':
        return this.generateMixedOperations(digits, rows, difficulty);
      default:
        return this.generateSimpleAddition(digits, rows, difficulty);
    }
  }

  /**
   * Generate simple addition exercise
   */
  generateSimpleAddition(maxDigits, rows, difficulty) {
    const numbers = [];
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    
    // Generate first number
    const firstNumber = this.generateNumber(maxDigits, difficultyMultiplier);
    numbers.push(firstNumber);

    // Generate additional numbers for multiple rows
    for (let i = 1; i < rows; i++) {
      const nextNumber = this.generateNumber(maxDigits, difficultyMultiplier, 'addition');
      numbers.push(nextNumber);
    }

    const result = numbers.reduce((sum, num) => sum + num, 0);
    const question = numbers.join(' + ');

    return {
      type: 'simple_addition',
      question: question + ' = ?',
      numbers: numbers,
      operation: 'addition',
      answer: result,
      difficulty: difficulty,
      maxDigits: maxDigits,
      rows: rows,
      timeLimit: this.calculateTimeLimit(maxDigits, rows, difficulty),
      hints: this.generateHints('addition', numbers),
      explanation: this.generateExplanation('addition', numbers, result),
      sorobanSteps: this.generateSorobanSteps('addition', numbers)
    };
  }

  /**
   * Generate simple subtraction exercise
   */
  generateSimpleSubtraction(maxDigits, rows, difficulty) {
    const numbers = [];
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    
    // Start with a larger number to ensure positive result
    let currentResult = this.generateNumber(maxDigits, difficultyMultiplier, 'subtraction_start');
    numbers.push(currentResult);

    // Generate numbers to subtract
    for (let i = 1; i < rows; i++) {
      const maxSubtract = Math.min(currentResult, this.generateNumber(maxDigits - 1, difficultyMultiplier));
      const subtractNumber = Math.floor(Math.random() * maxSubtract) + 1;
      numbers.push(subtractNumber);
      currentResult -= subtractNumber;
    }

    const question = numbers[0] + ' - ' + numbers.slice(1).join(' - ');
    
    return {
      type: 'simple_subtraction',
      question: question + ' = ?',
      numbers: numbers,
      operation: 'subtraction',
      answer: currentResult,
      difficulty: difficulty,
      maxDigits: maxDigits,
      rows: rows,
      timeLimit: this.calculateTimeLimit(maxDigits, rows, difficulty),
      hints: this.generateHints('subtraction', numbers),
      explanation: this.generateExplanation('subtraction', numbers, currentResult),
      sorobanSteps: this.generateSorobanSteps('subtraction', numbers)
    };
  }

  /**
   * Generate Friends of 5 addition exercise
   */
  generateFriendsOf5Addition(maxDigits, rows, difficulty) {
    const friendPair = this.friendsOf5[Math.floor(Math.random() * this.friendsOf5.length)];
    const baseNumber = this.generateNumber(maxDigits - 1, 1) * 10; // Ensure we work with tens place
    
    const numbers = [baseNumber + friendPair.a, friendPair.b];
    
    // Add more numbers if multiple rows
    for (let i = 2; i < rows; i++) {
      numbers.push(this.generateNumber(1, 0.5));
    }

    const result = numbers.reduce((sum, num) => sum + num, 0);
    const question = numbers.join(' + ');

    return {
      type: 'friends_of_5_addition',
      question: question + ' = ?',
      numbers: numbers,
      operation: 'addition',
      answer: result,
      difficulty: difficulty,
      maxDigits: maxDigits,
      rows: rows,
      friendsUsed: [friendPair],
      timeLimit: this.calculateTimeLimit(maxDigits, rows, difficulty),
      hints: this.generateFriendsOf5Hints(friendPair, 'addition'),
      explanation: this.generateFriendsOf5Explanation(friendPair, numbers, result),
      sorobanSteps: this.generateFriendsOf5Steps(friendPair, numbers, 'addition')
    };
  }

  /**
   * Generate Friends of 10 addition exercise
   */
  generateFriendsOf10Addition(maxDigits, rows, difficulty) {
    const friendPair = this.friendsOf10[Math.floor(Math.random() * this.friendsOf10.length)];
    const baseNumber = this.generateNumber(maxDigits - 1, 1) * 10; // Work with tens place
    
    const numbers = [baseNumber + friendPair.a, friendPair.b];
    
    // Add more numbers if multiple rows
    for (let i = 2; i < rows; i++) {
      numbers.push(this.generateNumber(1, 0.5));
    }

    const result = numbers.reduce((sum, num) => sum + num, 0);
    const question = numbers.join(' + ');

    return {
      type: 'friends_of_10_addition',
      question: question + ' = ?',
      numbers: numbers,
      operation: 'addition',
      answer: result,
      difficulty: difficulty,
      maxDigits: maxDigits,
      rows: rows,
      friendsUsed: [friendPair],
      timeLimit: this.calculateTimeLimit(maxDigits, rows, difficulty),
      hints: this.generateFriendsOf10Hints(friendPair, 'addition'),
      explanation: this.generateFriendsOf10Explanation(friendPair, numbers, result),
      sorobanSteps: this.generateFriendsOf10Steps(friendPair, numbers, 'addition')
    };
  }

  /**
   * Generate mixed operations exercise
   */
  generateMixedOperations(maxDigits, rows, difficulty) {
    const operations = ['+', '-'];
    const numbers = [];
    const operationsList = [];
    
    // Start with a number
    let currentResult = this.generateNumber(maxDigits, 1);
    numbers.push(currentResult);

    // Generate alternating operations
    for (let i = 1; i < rows; i++) {
      const operation = operations[Math.floor(Math.random() * operations.length)];
      operationsList.push(operation);
      
      let nextNumber;
      if (operation === '+') {
        nextNumber = this.generateNumber(maxDigits - 1, 0.7);
        currentResult += nextNumber;
      } else {
        nextNumber = Math.floor(Math.random() * Math.min(currentResult, this.generateNumber(maxDigits - 1, 0.7))) + 1;
        currentResult -= nextNumber;
      }
      numbers.push(nextNumber);
    }

    // Build question string
    let question = numbers[0].toString();
    for (let i = 0; i < operationsList.length; i++) {
      question += ` ${operationsList[i]} ${numbers[i + 1]}`;
    }

    return {
      type: 'mixed_operations',
      question: question + ' = ?',
      numbers: numbers,
      operations: operationsList,
      answer: currentResult,
      difficulty: difficulty,
      maxDigits: maxDigits,
      rows: rows,
      timeLimit: this.calculateTimeLimit(maxDigits, rows, difficulty, 'mixed'),
      hints: this.generateMixedOperationHints(numbers, operationsList),
      explanation: this.generateMixedOperationExplanation(numbers, operationsList, currentResult),
      sorobanSteps: this.generateMixedOperationSteps(numbers, operationsList)
    };
  }

  /**
   * Helper methods
   */
  generateNumber(maxDigits, difficultyMultiplier, context = 'general') {
    const min = Math.pow(10, maxDigits - 1);
    const max = Math.pow(10, maxDigits) - 1;
    
    let adjustedMax = Math.floor(max * difficultyMultiplier);
    if (adjustedMax < min) adjustedMax = min;
    
    if (context === 'subtraction_start') {
      // Ensure we start with a larger number for subtraction
      adjustedMax = Math.max(adjustedMax, min * 2);
    }
    
    return Math.floor(Math.random() * (adjustedMax - min + 1)) + min;
  }

  getDifficultyMultiplier(difficulty) {
    switch (difficulty) {
      case 'easy': return 0.6;
      case 'medium': return 0.8;
      case 'hard': return 1.0;
      default: return 0.8;
    }
  }

  calculateTimeLimit(maxDigits, rows, difficulty, type = 'normal') {
    let baseTime = 10; // seconds
    baseTime += maxDigits * 3;
    baseTime += rows * 2;
    
    if (type === 'mixed') baseTime += 5;
    
    switch (difficulty) {
      case 'easy': return Math.floor(baseTime * 1.5);
      case 'medium': return baseTime;
      case 'hard': return Math.floor(baseTime * 0.8);
      default: return baseTime;
    }
  }

  getExerciseDistribution(levelConfig, exerciseType, focusAreas) {
    const distribution = {};
    const availableOperations = levelConfig.operations;

    if (focusAreas.length > 0) {
      // Focus on specific areas
      focusAreas.forEach(area => {
        if (availableOperations.includes(area)) {
          distribution[area] = 0.4; // 40% focus on each focus area
        }
      });
    } else {
      // Default distribution
      if (availableOperations.includes('addition')) distribution['simple_addition'] = 0.3;
      if (availableOperations.includes('subtraction')) distribution['simple_subtraction'] = 0.3;
      if (availableOperations.includes('friends_of_5')) {
        distribution['friends_of_5_addition'] = 0.2;
        distribution['friends_of_5_subtraction'] = 0.1;
      }
      if (availableOperations.includes('friends_of_10')) {
        distribution['friends_of_10_addition'] = 0.1;
      }
    }

    return distribution;
  }

  selectExerciseType(distribution, index, total) {
    const types = Object.keys(distribution);
    const weights = Object.values(distribution);
    
    // Weighted random selection
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return { type: types[i] };
      }
    }
    
    // Fallback
    return { type: types[0] || 'simple_addition' };
  }

  isDuplicate(exercise) {
    const signature = this.getExerciseSignature(exercise);
    return this.usedExercises.has(signature);
  }

  getExerciseSignature(exercise) {
    return `${exercise.type}_${exercise.question}`;
  }

  // Generate hints, explanations, and Soroban steps
  generateHints(operation, numbers) {
    return [
      {
        level: 1,
        text: `هذه مسألة ${operation === 'addition' ? 'جمع' : 'طرح'} بسيطة. ابدأ بالرقم الأول.`,
        pointsDeduction: 1
      },
      {
        level: 2,
        text: `استخدم السوروبان خطوة بخطوة. ابدأ بـ ${numbers[0]}.`,
        pointsDeduction: 2
      }
    ];
  }

  generateExplanation(operation, numbers, result) {
    const steps = [];
    if (operation === 'addition') {
      let running = numbers[0];
      steps.push(`ابدأ بـ ${numbers[0]}`);
      for (let i = 1; i < numbers.length; i++) {
        running += numbers[i];
        steps.push(`أضف ${numbers[i]} = ${running}`);
      }
    }
    
    return {
      text: `شرح خطوات الحل:`,
      steps: steps,
      finalAnswer: `الجواب النهائي: ${result}`
    };
  }

  generateSorobanSteps(operation, numbers) {
    // Generate detailed Soroban manipulation steps
    const steps = [];
    steps.push({
      step: 1,
      action: 'clear',
      description: 'امسح السوروبان'
    });
    
    steps.push({
      step: 2,
      action: 'set',
      value: numbers[0],
      description: `اضبط الرقم ${numbers[0]} على السوروبان`
    });

    for (let i = 1; i < numbers.length; i++) {
      steps.push({
        step: i + 2,
        action: operation === 'addition' ? 'add' : 'subtract',
        value: numbers[i],
        description: `${operation === 'addition' ? 'أضف' : 'اطرح'} ${numbers[i]}`
      });
    }

    return steps;
  }

  generateFriendsOf5Hints(friendPair, operation) {
    return [
      {
        level: 1,
        text: `هذه مسألة تستخدم أصدقاء الخمسة. ${friendPair.a} + ${friendPair.b} = 5`,
        pointsDeduction: 1
      },
      {
        level: 2,
        text: `استخدم قاعدة: +${friendPair.b} = +5-${5-friendPair.b}`,
        pointsDeduction: 2
      }
    ];
  }

  generateFriendsOf5Explanation(friendPair, numbers, result) {
    return {
      text: 'شرح قاعدة أصدقاء الخمسة:',
      steps: [
        `${friendPair.a} و ${friendPair.b} هما صديقان للرقم 5`,
        `${friendPair.a} + ${friendPair.b} = 5`,
        `استخدم هذه القاعدة لحل المسألة بسرعة`
      ],
      finalAnswer: `الجواب: ${result}`
    };
  }

  generateFriendsOf5Steps(friendPair, numbers, operation) {
    return [
      {
        step: 1,
        action: 'identify',
        description: `تعرف على أصدقاء الخمسة: ${friendPair.a} + ${friendPair.b} = 5`
      },
      {
        step: 2,
        action: 'apply_rule',
        description: `طبق القاعدة على السوروبان`
      }
    ];
  }

  // Similar methods for Friends of 10 and Mixed Operations...
  generateFriendsOf10Hints(friendPair, operation) {
    return [
      {
        level: 1,
        text: `هذه مسألة تستخدم أصدقاء العشرة. ${friendPair.a} + ${friendPair.b} = 10`,
        pointsDeduction: 1
      }
    ];
  }

  generateFriendsOf10Explanation(friendPair, numbers, result) {
    return {
      text: 'شرح قاعدة أصدقاء العشرة:',
      steps: [
        `${friendPair.a} و ${friendPair.b} هما صديقان للرقم 10`,
        `استخدم هذه القاعدة للحل السريع`
      ],
      finalAnswer: `الجواب: ${result}`
    };
  }

  generateFriendsOf10Steps(friendPair, numbers, operation) {
    return [
      {
        step: 1,
        action: 'identify',
        description: `تعرف على أصدقاء العشرة: ${friendPair.a} + ${friendPair.b} = 10`
      }
    ];
  }

  generateMixedOperationHints(numbers, operations) {
    return [
      {
        level: 1,
        text: 'هذه مسألة عمليات مختلطة. حل خطوة بخطوة من اليسار لليمين.',
        pointsDeduction: 1
      }
    ];
  }

  generateMixedOperationExplanation(numbers, operations, result) {
    const steps = [];
    let current = numbers[0];
    steps.push(`ابدأ بـ ${current}`);
    
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      const num = numbers[i + 1];
      if (op === '+') {
        current += num;
        steps.push(`${current - num} + ${num} = ${current}`);
      } else {
        current -= num;
        steps.push(`${current + num} - ${num} = ${current}`);
      }
    }
    
    return {
      text: 'شرح العمليات المختلطة:',
      steps: steps,
      finalAnswer: `الجواب النهائي: ${result}`
    };
  }

  generateMixedOperationSteps(numbers, operations) {
    const steps = [];
    steps.push({
      step: 1,
      action: 'set',
      value: numbers[0],
      description: `ابدأ بـ ${numbers[0]}`
    });

    for (let i = 0; i < operations.length; i++) {
      steps.push({
        step: i + 2,
        action: operations[i] === '+' ? 'add' : 'subtract',
        value: numbers[i + 1],
        description: `${operations[i] === '+' ? 'أضف' : 'اطرح'} ${numbers[i + 1]}`
      });
    }

    return steps;
  }
}

module.exports = SorobanGenerator;
