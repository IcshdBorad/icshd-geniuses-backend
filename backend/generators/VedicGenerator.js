/**
 * Vedic Math Exercise Generator for ICSHD GENIUSES
 * Generates exercises based on Vedic Mathematics Sutras and techniques
 */

class VedicGenerator {
  constructor() {
    this.sutras = {
      'ekadhikina_purvena': {
        name: 'Ekadhikina Purvena',
        nameAr: 'واحد أكثر من السابق',
        description: 'One more than the previous one',
        applications: ['squares_ending_5', 'multiplication_11']
      },
      'nikhilam_navatashcaramam_dashatah': {
        name: 'Nikhilam Navatashcaramam Dashatah',
        nameAr: 'الكل من 9 والأخير من 10',
        description: 'All from 9 and the last from 10',
        applications: ['subtraction_from_powers_10', 'multiplication_near_base']
      },
      'urdhva_tiryagbhyam': {
        name: 'Urdhva-tiryagbhyam',
        nameAr: 'عمودياً وقطرياً',
        description: 'Vertically and crosswise',
        applications: ['general_multiplication', 'algebraic_multiplication']
      },
      'paravartya_yojayet': {
        name: 'Paravartya Yojayet',
        nameAr: 'انقل واجمع',
        description: 'Transpose and adjust',
        applications: ['division', 'equations']
      },
      'shunyam_saamyasamuccaye': {
        name: 'Shunyam Saamyasamuccaye',
        nameAr: 'صفر عندما يكون المجموع متساوياً',
        description: 'When the sum is the same that sum is zero',
        applications: ['special_equations', 'factorization']
      },
      'anurupye_shunyamanyat': {
        name: 'Anurupye Shunyamanyat',
        nameAr: 'إذا كان واحد في النسبة، الآخر صفر',
        description: 'If one is in ratio, the other is zero',
        applications: ['proportions', 'equations']
      },
      'sankalana_vyavakalanabhyam': {
        name: 'Sankalana-vyavakalanabhyam',
        nameAr: 'بالجمع والطرح',
        description: 'By addition and by subtraction',
        applications: ['simultaneous_equations', 'elimination']
      },
      'puranapuranabhyam': {
        name: 'Puranapuranabhyam',
        nameAr: 'بالإكمال أو عدم الإكمال',
        description: 'By the completion or non-completion',
        applications: ['square_roots', 'cube_roots']
      },
      'chalana_kalana': {
        name: 'Chalana-kalana',
        nameAr: 'الفرق والمنتج',
        description: 'Differences and products',
        applications: ['factorization', 'algebraic_identities']
      }
    };

    this.levels = {
      'V1': { 
        sutras: ['ekadhikina_purvena'], 
        operations: ['squares_ending_5', 'multiplication_11'],
        maxDigits: 2,
        ageGroup: 'under_12'
      },
      'V2': { 
        sutras: ['ekadhikina_purvena', 'nikhilam_navatashcaramam_dashatah'], 
        operations: ['squares_ending_5', 'multiplication_11', 'subtraction_complement'],
        maxDigits: 3,
        ageGroup: 'under_12'
      },
      'V3': { 
        sutras: ['urdhva_tiryagbhyam'], 
        operations: ['multiplication_2x2', 'multiplication_3x2'],
        maxDigits: 3,
        ageGroup: 'over_12'
      },
      'V4': { 
        sutras: ['urdhva_tiryagbhyam', 'paravartya_yojayet'], 
        operations: ['multiplication_general', 'division_basic'],
        maxDigits: 4,
        ageGroup: 'over_12'
      },
      'V5': { 
        sutras: ['puranapuranabhyam'], 
        operations: ['square_roots', 'cube_roots'],
        maxDigits: 4,
        ageGroup: 'over_12'
      }
    };

    this.usedExercises = new Set();
  }

  /**
   * Generate Vedic Math exercises
   */
  generateExercises(config) {
    const {
      level = 'V1',
      ageGroup = 'over_12',
      count = 10,
      exerciseType = 'squares_ending_5',
      difficulty = 'medium',
      focusAreas = [],
      adaptiveData = null
    } = config;

    const exercises = [];
    const levelConfig = this.levels[level];

    if (!levelConfig) {
      throw new Error(`Invalid Vedic level: ${level}`);
    }

    for (let i = 0; i < count; i++) {
      const operation = this.selectOperation(levelConfig, exerciseType, focusAreas, i);
      const exercise = this.generateSingleExercise(operation, levelConfig, difficulty);
      
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
   * Generate single Vedic exercise based on operation type
   */
  generateSingleExercise(operation, levelConfig, difficulty) {
    switch (operation) {
      case 'squares_ending_5':
        return this.generateSquareEndingIn5(levelConfig, difficulty);
      case 'multiplication_11':
        return this.generateMultiplicationBy11(levelConfig, difficulty);
      case 'subtraction_complement':
        return this.generateSubtractionComplement(levelConfig, difficulty);
      case 'multiplication_2x2':
        return this.generateMultiplication2x2(levelConfig, difficulty);
      case 'multiplication_3x2':
        return this.generateMultiplication3x2(levelConfig, difficulty);
      case 'division_basic':
        return this.generateBasicDivision(levelConfig, difficulty);
      case 'square_roots':
        return this.generateSquareRoot(levelConfig, difficulty);
      case 'cube_roots':
        return this.generateCubeRoot(levelConfig, difficulty);
      default:
        return this.generateSquareEndingIn5(levelConfig, difficulty);
    }
  }

  /**
   * Generate square of numbers ending in 5 using Ekadhikina Purvena
   */
  generateSquareEndingIn5(levelConfig, difficulty) {
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const maxTens = Math.min(9, Math.floor(9 * difficultyMultiplier));
    const tensDigit = Math.floor(Math.random() * maxTens) + 1;
    
    const number = tensDigit * 10 + 5; // Numbers like 15, 25, 35, etc.
    const result = number * number;
    
    // Vedic calculation: n5² = n(n+1)25
    const n = Math.floor(number / 10);
    const vedicResult = n * (n + 1) * 100 + 25;

    return {
      type: 'squares_ending_5',
      question: `${number}² = ?`,
      number: number,
      answer: result,
      vedicAnswer: vedicResult,
      sutra: 'ekadhikina_purvena',
      sutraNameAr: 'واحد أكثر من السابق',
      difficulty: difficulty,
      timeLimit: this.calculateTimeLimit(difficulty, 'square'),
      hints: this.generateSquareEndingIn5Hints(number, n),
      explanation: this.generateSquareEndingIn5Explanation(number, n, result),
      vedicSteps: this.generateSquareEndingIn5Steps(number, n)
    };
  }

  /**
   * Generate multiplication by 11 using Ekadhikina Purvena
   */
  generateMultiplicationBy11(levelConfig, difficulty) {
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const maxDigits = Math.min(levelConfig.maxDigits, Math.floor(3 * difficultyMultiplier) + 1);
    
    let number;
    if (maxDigits === 2) {
      number = Math.floor(Math.random() * 90) + 10; // 10-99
    } else {
      number = Math.floor(Math.random() * 900) + 100; // 100-999
    }
    
    const result = number * 11;
    
    return {
      type: 'multiplication_11',
      question: `${number} × 11 = ?`,
      number: number,
      multiplier: 11,
      answer: result,
      sutra: 'ekadhikina_purvena',
      sutraNameAr: 'واحد أكثر من السابق',
      difficulty: difficulty,
      timeLimit: this.calculateTimeLimit(difficulty, 'multiplication'),
      hints: this.generateMultiplicationBy11Hints(number),
      explanation: this.generateMultiplicationBy11Explanation(number, result),
      vedicSteps: this.generateMultiplicationBy11Steps(number)
    };
  }

  /**
   * Generate subtraction from powers of 10 using Nikhilam
   */
  generateSubtractionComplement(levelConfig, difficulty) {
    const powers = [100, 1000, 10000];
    const powerIndex = Math.min(powers.length - 1, Math.floor(Math.random() * powers.length));
    const base = powers[powerIndex];
    
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const maxSubtract = Math.floor(base * 0.8 * difficultyMultiplier);
    const subtractNumber = Math.floor(Math.random() * maxSubtract) + 1;
    
    const result = base - subtractNumber;
    
    return {
      type: 'subtraction_complement',
      question: `${base} - ${subtractNumber} = ?`,
      base: base,
      subtractNumber: subtractNumber,
      answer: result,
      sutra: 'nikhilam_navatashcaramam_dashatah',
      sutraNameAr: 'الكل من 9 والأخير من 10',
      difficulty: difficulty,
      timeLimit: this.calculateTimeLimit(difficulty, 'subtraction'),
      hints: this.generateSubtractionComplementHints(base, subtractNumber),
      explanation: this.generateSubtractionComplementExplanation(base, subtractNumber, result),
      vedicSteps: this.generateSubtractionComplementSteps(base, subtractNumber)
    };
  }

  /**
   * Generate 2x2 multiplication using Urdhva-tiryagbhyam
   */
  generateMultiplication2x2(levelConfig, difficulty) {
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const maxValue = Math.floor(99 * difficultyMultiplier);
    
    const num1 = Math.floor(Math.random() * (maxValue - 10)) + 10;
    const num2 = Math.floor(Math.random() * (maxValue - 10)) + 10;
    const result = num1 * num2;
    
    return {
      type: 'multiplication_2x2',
      question: `${num1} × ${num2} = ?`,
      number1: num1,
      number2: num2,
      answer: result,
      sutra: 'urdhva_tiryagbhyam',
      sutraNameAr: 'عمودياً وقطرياً',
      difficulty: difficulty,
      timeLimit: this.calculateTimeLimit(difficulty, 'multiplication_complex'),
      hints: this.generateUrdhvaHints(num1, num2),
      explanation: this.generateUrdhvaExplanation(num1, num2, result),
      vedicSteps: this.generateUrdhvaSteps(num1, num2)
    };
  }

  /**
   * Generate square root using Puranapuranabhyam
   */
  generateSquareRoot(levelConfig, difficulty) {
    // Generate perfect squares for easier calculation
    const perfectSquares = [16, 25, 36, 49, 64, 81, 100, 121, 144, 169, 196, 225, 256, 289, 324, 361, 400];
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    const maxIndex = Math.min(perfectSquares.length - 1, Math.floor(perfectSquares.length * difficultyMultiplier));
    
    const square = perfectSquares[Math.floor(Math.random() * (maxIndex + 1))];
    const result = Math.sqrt(square);
    
    return {
      type: 'square_root',
      question: `√${square} = ?`,
      number: square,
      answer: result,
      sutra: 'puranapuranabhyam',
      sutraNameAr: 'بالإكمال أو عدم الإكمال',
      difficulty: difficulty,
      timeLimit: this.calculateTimeLimit(difficulty, 'root'),
      hints: this.generateSquareRootHints(square),
      explanation: this.generateSquareRootExplanation(square, result),
      vedicSteps: this.generateSquareRootSteps(square)
    };
  }

  /**
   * Helper methods for generating hints, explanations, and steps
   */
  generateSquareEndingIn5Hints(number, n) {
    return [
      {
        level: 1,
        text: `استخدم قاعدة الفيدا: للأرقام المنتهية بـ 5، ${number}² = ${n} × ${n + 1} ثم أضف 25`,
        pointsDeduction: 1
      },
      {
        level: 2,
        text: `${n} × ${n + 1} = ${n * (n + 1)}، ثم أضف 25 في النهاية`,
        pointsDeduction: 2
      }
    ];
  }

  generateSquareEndingIn5Explanation(number, n, result) {
    return {
      text: 'شرح قاعدة مربع الأرقام المنتهية بـ 5:',
      steps: [
        `الرقم: ${number}`,
        `خذ الرقم في خانة العشرات: ${n}`,
        `اضرب ${n} × ${n + 1} = ${n * (n + 1)}`,
        `أضف 25 في النهاية: ${n * (n + 1)}25`,
        `النتيجة: ${result}`
      ],
      sutraExplanation: 'هذه القاعدة تستخدم سوترا "واحد أكثر من السابق" (Ekadhikina Purvena)'
    };
  }

  generateSquareEndingIn5Steps(number, n) {
    return [
      {
        step: 1,
        action: 'identify',
        description: `تعرف على الرقم المنتهي بـ 5: ${number}`
      },
      {
        step: 2,
        action: 'extract_tens',
        value: n,
        description: `استخرج رقم العشرات: ${n}`
      },
      {
        step: 3,
        action: 'multiply',
        calculation: `${n} × ${n + 1}`,
        result: n * (n + 1),
        description: `اضرب ${n} في ${n + 1}`
      },
      {
        step: 4,
        action: 'append',
        value: 25,
        description: 'أضف 25 في النهاية'
      }
    ];
  }

  generateMultiplicationBy11Hints(number) {
    const digits = number.toString().split('').map(Number);
    return [
      {
        level: 1,
        text: 'للضرب في 11، اجمع كل رقمين متجاورين',
        pointsDeduction: 1
      },
      {
        level: 2,
        text: `ابدأ من اليمين: ${digits[digits.length - 1]}، ثم اجمع الأرقام المتجاورة`,
        pointsDeduction: 2
      }
    ];
  }

  generateMultiplicationBy11Explanation(number, result) {
    const digits = number.toString().split('').map(Number);
    const steps = [];
    
    if (digits.length === 2) {
      steps.push(`الرقم: ${number} = ${digits[0]}${digits[1]}`);
      steps.push(`النتيجة: ${digits[0]}(${digits[0] + digits[1]})${digits[1]}`);
      if (digits[0] + digits[1] >= 10) {
        steps.push('إذا كان المجموع أكبر من 9، احمل الرقم للخانة التالية');
      }
    }
    
    return {
      text: 'شرح الضرب في 11:',
      steps: steps,
      finalAnswer: `النتيجة: ${result}`,
      sutraExplanation: 'هذه الطريقة تستخدم مبدأ "واحد أكثر من السابق"'
    };
  }

  generateMultiplicationBy11Steps(number) {
    const digits = number.toString().split('').map(Number);
    const steps = [
      {
        step: 1,
        action: 'write_first',
        digit: digits[0],
        description: `اكتب الرقم الأول: ${digits[0]}`
      }
    ];

    for (let i = 0; i < digits.length - 1; i++) {
      steps.push({
        step: i + 2,
        action: 'add_adjacent',
        calculation: `${digits[i]} + ${digits[i + 1]}`,
        result: digits[i] + digits[i + 1],
        description: `اجمع ${digits[i]} + ${digits[i + 1]}`
      });
    }

    steps.push({
      step: digits.length + 1,
      action: 'write_last',
      digit: digits[digits.length - 1],
      description: `اكتب الرقم الأخير: ${digits[digits.length - 1]}`
    });

    return steps;
  }

  // Additional helper methods...
  getDifficultyMultiplier(difficulty) {
    switch (difficulty) {
      case 'easy': return 0.6;
      case 'medium': return 0.8;
      case 'hard': return 1.0;
      default: return 0.8;
    }
  }

  calculateTimeLimit(difficulty, type) {
    let baseTime = 15; // seconds
    
    switch (type) {
      case 'square': baseTime = 20; break;
      case 'multiplication': baseTime = 25; break;
      case 'multiplication_complex': baseTime = 35; break;
      case 'subtraction': baseTime = 15; break;
      case 'root': baseTime = 30; break;
    }
    
    switch (difficulty) {
      case 'easy': return Math.floor(baseTime * 1.5);
      case 'medium': return baseTime;
      case 'hard': return Math.floor(baseTime * 0.8);
      default: return baseTime;
    }
  }

  selectOperation(levelConfig, exerciseType, focusAreas, index) {
    if (focusAreas.length > 0) {
      return focusAreas[index % focusAreas.length];
    }
    
    const operations = levelConfig.operations;
    return operations[Math.floor(Math.random() * operations.length)];
  }

  isDuplicate(exercise) {
    return this.usedExercises.has(this.getExerciseSignature(exercise));
  }

  getExerciseSignature(exercise) {
    return `${exercise.type}_${exercise.question}`;
  }

  // Placeholder methods for other operations (to be implemented)
  generateSubtractionComplementHints(base, subtractNumber) {
    return [
      {
        level: 1,
        text: 'استخدم قاعدة "الكل من 9 والأخير من 10"',
        pointsDeduction: 1
      }
    ];
  }

  generateSubtractionComplementExplanation(base, subtractNumber, result) {
    return {
      text: 'شرح قاعدة الطرح من قوى العشرة:',
      steps: [
        `اطرح كل رقم من 9 عدا الأخير`,
        `اطرح الرقم الأخير من 10`
      ],
      finalAnswer: `النتيجة: ${result}`
    };
  }

  generateSubtractionComplementSteps(base, subtractNumber) {
    return [
      {
        step: 1,
        action: 'apply_nikhilam',
        description: 'طبق قاعدة نيخيلام'
      }
    ];
  }

  generateUrdhvaHints(num1, num2) {
    return [
      {
        level: 1,
        text: 'استخدم طريقة "عمودياً وقطرياً" للضرب',
        pointsDeduction: 1
      }
    ];
  }

  generateUrdhvaExplanation(num1, num2, result) {
    return {
      text: 'شرح طريقة الضرب العمودي والقطري:',
      steps: [
        'اضرب الأرقام عمودياً وقطرياً',
        'اجمع النتائج في كل خانة'
      ],
      finalAnswer: `النتيجة: ${result}`
    };
  }

  generateUrdhvaSteps(num1, num2) {
    return [
      {
        step: 1,
        action: 'setup',
        description: 'رتب الأرقام للضرب العمودي والقطري'
      }
    ];
  }

  generateSquareRootHints(square) {
    return [
      {
        level: 1,
        text: 'استخدم طريقة الفيدا لاستخراج الجذر التربيعي',
        pointsDeduction: 1
      }
    ];
  }

  generateSquareRootExplanation(square, result) {
    return {
      text: 'شرح استخراج الجذر التربيعي:',
      steps: [
        `الرقم: ${square}`,
        `الجذر التربيعي: ${result}`
      ],
      finalAnswer: `النتيجة: ${result}`
    };
  }

  generateSquareRootSteps(square) {
    return [
      {
        step: 1,
        action: 'identify_perfect_square',
        description: `تعرف على المربع الكامل: ${square}`
      }
    ];
  }
}

module.exports = VedicGenerator;
