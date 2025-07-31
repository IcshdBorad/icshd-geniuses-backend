/**
 * IQ Games Generator for ICSHD GENIUSES
 * Generates intelligence and brain training games for different age groups
 */

class IQGamesGenerator {
  constructor() {
    this.gradeLevels = {
      'IQ1': { // 1st-2nd Grade
        name: 'الأول والثاني الابتدائي',
        ageRange: '6-8',
        games: ['shape_matching', 'simple_puzzles', 'color_patterns', 'basic_memory', 'counting_games']
      },
      'IQ2': { // 3rd-4th Grade
        name: 'الثالث والرابع الابتدائي',
        ageRange: '8-10',
        games: ['pattern_blocks', 'sudoku_4x4', 'tangram_basic', 'memory_sequences', 'logic_grids']
      },
      'IQ3': { // 5th-6th Grade
        name: 'الخامس والسادس الابتدائي',
        ageRange: '10-12',
        games: ['sudoku_6x6', 'tangram_advanced', 'spatial_reasoning', 'number_puzzles', 'brain_teasers']
      },
      'IQ4': { // 7th-8th Grade
        name: 'الأول والثاني المتوسط',
        ageRange: '12-14',
        games: ['sudoku_9x9', 'logic_puzzles', 'spatial_3d', 'cryptarithmetic', 'lateral_thinking']
      },
      'IQ5': { // 9th-10th Grade
        name: 'الثالث المتوسط والأول الثانوي',
        ageRange: '14-16',
        games: ['advanced_sudoku', 'complex_puzzles', 'mathematical_reasoning', 'strategic_thinking', 'problem_solving']
      },
      'IQ6': { // 11th-12th Grade
        name: 'الثاني والثالث الثانوي',
        ageRange: '16-18',
        games: ['expert_puzzles', 'analytical_reasoning', 'creative_problem_solving', 'advanced_logic', 'competitive_puzzles']
      }
    };

    this.gameTypes = {
      'shape_matching': {
        name: 'مطابقة الأشكال',
        description: 'Match shapes and patterns',
        skills: ['visual_perception', 'pattern_recognition']
      },
      'sudoku_4x4': {
        name: 'سودوكو 4×4',
        description: 'Simple Sudoku puzzles',
        skills: ['logical_thinking', 'number_placement']
      },
      'tangram_basic': {
        name: 'تانجرام أساسي',
        description: 'Basic Tangram puzzles',
        skills: ['spatial_reasoning', 'geometric_thinking']
      },
      'memory_sequences': {
        name: 'تسلسل الذاكرة',
        description: 'Remember and repeat sequences',
        skills: ['working_memory', 'attention']
      },
      'logic_grids': {
        name: 'شبكات المنطق',
        description: 'Logic grid puzzles',
        skills: ['deductive_reasoning', 'logical_analysis']
      },
      'brain_teasers': {
        name: 'ألغاز ذهنية',
        description: 'Brain teasing puzzles',
        skills: ['creative_thinking', 'problem_solving']
      }
    };

    this.usedGames = new Set();
  }

  /**
   * Generate IQ games
   */
  generateExercises(config) {
    const {
      level = 'IQ1',
      count = 10,
      gameType = 'shape_matching',
      difficulty = 'medium',
      focusAreas = [],
      adaptiveData = null
    } = config;

    const games = [];
    const levelConfig = this.gradeLevels[level];

    if (!levelConfig) {
      throw new Error(`Invalid IQ level: ${level}`);
    }

    for (let i = 0; i < count; i++) {
      const selectedGame = this.selectGameType(levelConfig, gameType, focusAreas, i);
      const game = this.generateSingleGame(selectedGame, level, difficulty);
      
      if (game && !this.isDuplicate(game)) {
        games.push(game);
        this.usedGames.add(this.getGameSignature(game));
      } else {
        i--; // Retry
      }
    }

    return games;
  }

  /**
   * Generate single IQ game
   */
  generateSingleGame(gameType, level, difficulty) {
    switch (gameType) {
      case 'shape_matching':
        return this.generateShapeMatching(level, difficulty);
      case 'simple_puzzles':
        return this.generateSimplePuzzle(level, difficulty);
      case 'sudoku_4x4':
        return this.generateSudoku4x4(level, difficulty);
      case 'sudoku_6x6':
        return this.generateSudoku6x6(level, difficulty);
      case 'sudoku_9x9':
        return this.generateSudoku9x9(level, difficulty);
      case 'tangram_basic':
        return this.generateTangramBasic(level, difficulty);
      case 'memory_sequences':
        return this.generateMemorySequence(level, difficulty);
      case 'logic_grids':
        return this.generateLogicGrid(level, difficulty);
      case 'pattern_blocks':
        return this.generatePatternBlocks(level, difficulty);
      case 'brain_teasers':
        return this.generateBrainTeaser(level, difficulty);
      default:
        return this.generateShapeMatching(level, difficulty);
    }
  }

  /**
   * Generate shape matching game
   */
  generateShapeMatching(level, difficulty) {
    const shapes = ['circle', 'square', 'triangle', 'rectangle', 'diamond', 'star'];
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    
    const numShapes = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    const targetShape = shapes[Math.floor(Math.random() * Math.min(shapes.length, numShapes))];
    const targetColor = colors[Math.floor(Math.random() * colors.length)];
    
    const options = this.generateShapeOptions(targetShape, targetColor, numShapes, difficulty);
    const correctIndex = Math.floor(Math.random() * options.length);
    options[correctIndex] = { shape: targetShape, color: targetColor };
    
    return {
      type: 'shape_matching',
      question: `اختر الشكل المطابق: ${this.getShapeNameAr(targetShape)} ${this.getColorNameAr(targetColor)}`,
      target: { shape: targetShape, color: targetColor },
      options: options,
      answer: correctIndex,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'visual'),
      hints: this.generateShapeMatchingHints(targetShape, targetColor),
      explanation: this.generateShapeMatchingExplanation(targetShape, targetColor, correctIndex),
      skills: ['visual_perception', 'pattern_recognition'],
      visualData: {
        type: 'shape_grid',
        target: { shape: targetShape, color: targetColor },
        options: options
      }
    };
  }

  /**
   * Generate 4x4 Sudoku puzzle
   */
  generateSudoku4x4(level, difficulty) {
    const solution = this.generateSudoku4x4Solution();
    const puzzle = this.createSudoku4x4Puzzle(solution, difficulty);
    
    return {
      type: 'sudoku_4x4',
      question: 'أكمل شبكة السودوكو 4×4. كل صف وعمود ومربع 2×2 يجب أن يحتوي على الأرقام 1-4',
      puzzle: puzzle,
      solution: solution,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'sudoku_4x4'),
      hints: this.generateSudokuHints(puzzle, solution),
      explanation: this.generateSudokuExplanation(),
      skills: ['logical_thinking', 'number_placement', 'pattern_recognition'],
      visualData: {
        type: 'sudoku_grid',
        size: 4,
        puzzle: puzzle,
        regions: this.getSudoku4x4Regions()
      }
    };
  }

  /**
   * Generate memory sequence game
   */
  generateMemorySequence(level, difficulty) {
    const sequenceLength = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    const elements = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪'];
    const maxElements = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 6 : 8;
    
    const sequence = [];
    for (let i = 0; i < sequenceLength; i++) {
      sequence.push(elements[Math.floor(Math.random() * maxElements)]);
    }
    
    // Create options for the next element (if pattern exists) or test recall
    const testType = Math.random() > 0.5 ? 'recall' : 'pattern';
    let answer, options, question;
    
    if (testType === 'recall') {
      const hiddenIndex = Math.floor(Math.random() * sequence.length);
      answer = sequence[hiddenIndex];
      const displaySequence = [...sequence];
      displaySequence[hiddenIndex] = '❓';
      
      options = this.generateMemoryOptions(answer, elements, 4);
      question = `تذكر التسلسل واختر العنصر المفقود:\n${displaySequence.join(' ')}`;
    } else {
      // Pattern continuation
      const pattern = this.detectPattern(sequence);
      answer = this.getNextInSequence(sequence, pattern);
      options = this.generateMemoryOptions(answer, elements, 4);
      question = `ما هو العنصر التالي في التسلسل؟\n${sequence.join(' ')} ❓`;
    }
    
    return {
      type: 'memory_sequences',
      subtype: testType,
      question: question,
      sequence: sequence,
      options: options,
      answer: answer,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'memory'),
      hints: this.generateMemoryHints(testType, sequence),
      explanation: this.generateMemoryExplanation(testType, sequence, answer),
      skills: ['working_memory', 'attention', 'pattern_recognition'],
      visualData: {
        type: 'sequence_display',
        sequence: sequence,
        testType: testType
      }
    };
  }

  /**
   * Generate logic grid puzzle
   */
  generateLogicGrid(level, difficulty) {
    const gridSize = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 5;
    const categories = this.getLogicGridCategories(level);
    const puzzle = this.createLogicGridPuzzle(gridSize, categories, difficulty);
    
    return {
      type: 'logic_grids',
      question: 'حل شبكة المنطق باستخدام القرائن المعطاة',
      gridSize: gridSize,
      categories: categories,
      clues: puzzle.clues,
      solution: puzzle.solution,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'logic_grid'),
      hints: this.generateLogicGridHints(puzzle.clues),
      explanation: this.generateLogicGridExplanation(puzzle.solution),
      skills: ['deductive_reasoning', 'logical_analysis', 'systematic_thinking'],
      visualData: {
        type: 'logic_grid',
        size: gridSize,
        categories: categories,
        clues: puzzle.clues
      }
    };
  }

  /**
   * Generate brain teaser
   */
  generateBrainTeaser(level, difficulty) {
    const teasers = this.getBrainTeasersByLevel(level, difficulty);
    const selectedTeaser = teasers[Math.floor(Math.random() * teasers.length)];
    
    return {
      type: 'brain_teasers',
      question: selectedTeaser.question,
      answer: selectedTeaser.answer,
      category: selectedTeaser.category,
      difficulty: difficulty,
      level: level,
      timeLimit: this.calculateTimeLimit(difficulty, 'brain_teaser'),
      hints: selectedTeaser.hints,
      explanation: selectedTeaser.explanation,
      skills: ['creative_thinking', 'problem_solving', 'lateral_thinking'],
      visualData: selectedTeaser.visualData || null
    };
  }

  /**
   * Helper methods for generating specific game components
   */
  generateShapeOptions(targetShape, targetColor, numOptions, difficulty) {
    const shapes = ['circle', 'square', 'triangle', 'rectangle', 'diamond', 'star'];
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    
    const options = [];
    const used = new Set();
    
    for (let i = 0; i < numOptions - 1; i++) {
      let option;
      do {
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        option = { shape, color };
      } while (used.has(`${option.shape}_${option.color}`) || 
               (option.shape === targetShape && option.color === targetColor));
      
      options.push(option);
      used.add(`${option.shape}_${option.color}`);
    }
    
    return options;
  }

  generateSudoku4x4Solution() {
    // Generate a valid 4x4 Sudoku solution
    const solution = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 1, 4, 3],
      [4, 3, 2, 1]
    ];
    
    // Shuffle to create variation
    return this.shuffleSudoku4x4(solution);
  }

  createSudoku4x4Puzzle(solution, difficulty) {
    const puzzle = solution.map(row => [...row]);
    const cellsToRemove = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 10;
    
    const positions = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        positions.push([i, j]);
      }
    }
    
    // Randomly remove cells
    for (let i = 0; i < cellsToRemove && positions.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * positions.length);
      const [row, col] = positions.splice(randomIndex, 1)[0];
      puzzle[row][col] = 0; // 0 represents empty cell
    }
    
    return puzzle;
  }

  /**
   * Utility methods
   */
  calculateTimeLimit(difficulty, gameType) {
    let baseTime = 60; // seconds
    
    switch (gameType) {
      case 'visual': baseTime = 30; break;
      case 'sudoku_4x4': baseTime = 180; break;
      case 'sudoku_6x6': baseTime = 300; break;
      case 'sudoku_9x9': baseTime = 600; break;
      case 'memory': baseTime = 45; break;
      case 'logic_grid': baseTime = 240; break;
      case 'brain_teaser': baseTime = 120; break;
    }
    
    switch (difficulty) {
      case 'easy': return Math.floor(baseTime * 1.5);
      case 'medium': return baseTime;
      case 'hard': return Math.floor(baseTime * 0.8);
      default: return baseTime;
    }
  }

  selectGameType(levelConfig, gameType, focusAreas, index) {
    if (focusAreas.length > 0) {
      return focusAreas[index % focusAreas.length];
    }
    
    const availableGames = levelConfig.games;
    return availableGames[Math.floor(Math.random() * availableGames.length)];
  }

  isDuplicate(game) {
    return this.usedGames.has(this.getGameSignature(game));
  }

  getGameSignature(game) {
    return `${game.type}_${game.question.substring(0, 30)}`;
  }

  // Translation helpers
  getShapeNameAr(shape) {
    const translations = {
      'circle': 'دائرة',
      'square': 'مربع',
      'triangle': 'مثلث',
      'rectangle': 'مستطيل',
      'diamond': 'معين',
      'star': 'نجمة'
    };
    return translations[shape] || shape;
  }

  getColorNameAr(color) {
    const translations = {
      'red': 'أحمر',
      'blue': 'أزرق',
      'green': 'أخضر',
      'yellow': 'أصفر',
      'purple': 'بنفسجي',
      'orange': 'برتقالي'
    };
    return translations[color] || color;
  }

  // Placeholder methods for complex game generation
  shuffleSudoku4x4(solution) {
    // Simple shuffle implementation
    return solution;
  }

  getSudoku4x4Regions() {
    return [
      [[0,0], [0,1], [1,0], [1,1]], // Top-left 2x2
      [[0,2], [0,3], [1,2], [1,3]], // Top-right 2x2
      [[2,0], [2,1], [3,0], [3,1]], // Bottom-left 2x2
      [[2,2], [2,3], [3,2], [3,3]]  // Bottom-right 2x2
    ];
  }

  detectPattern(sequence) {
    // Simple pattern detection
    return 'random';
  }

  getNextInSequence(sequence, pattern) {
    // Return a random element for now
    const elements = ['🔴', '🔵', '🟢', '🟡'];
    return elements[Math.floor(Math.random() * elements.length)];
  }

  generateMemoryOptions(answer, elements, count) {
    const options = [answer];
    while (options.length < count) {
      const option = elements[Math.floor(Math.random() * elements.length)];
      if (!options.includes(option)) {
        options.push(option);
      }
    }
    return this.shuffleArray(options);
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getLogicGridCategories(level) {
    return ['أشخاص', 'ألوان', 'أطعمة'];
  }

  createLogicGridPuzzle(size, categories, difficulty) {
    return {
      clues: ['قرينة 1', 'قرينة 2'],
      solution: {}
    };
  }

  getBrainTeasersByLevel(level, difficulty) {
    return [
      {
        question: 'ما هو الشيء الذي يزيد كلما أخذت منه؟',
        answer: 'الحفرة',
        category: 'لغز لفظي',
        hints: [{ level: 1, text: 'فكر في شيء يصبح أكبر عندما تزيل منه', pointsDeduction: 1 }],
        explanation: { text: 'الحفرة تزيد كلما حفرت فيها أكثر' }
      }
    ];
  }

  // Generate hints and explanations
  generateShapeMatchingHints(targetShape, targetColor) {
    return [
      {
        level: 1,
        text: `ابحث عن ${this.getShapeNameAr(targetShape)} باللون ${this.getColorNameAr(targetColor)}`,
        pointsDeduction: 1
      }
    ];
  }

  generateShapeMatchingExplanation(targetShape, targetColor, correctIndex) {
    return {
      text: 'شرح مطابقة الأشكال:',
      steps: [
        `الشكل المطلوب: ${this.getShapeNameAr(targetShape)}`,
        `اللون المطلوب: ${this.getColorNameAr(targetColor)}`,
        `الإجابة الصحيحة في الموضع: ${correctIndex + 1}`
      ]
    };
  }

  generateSudokuHints(puzzle, solution) {
    return [
      {
        level: 1,
        text: 'ابدأ بالصفوف أو الأعمدة التي تحتوي على أكثر الأرقام',
        pointsDeduction: 1
      }
    ];
  }

  generateSudokuExplanation() {
    return {
      text: 'شرح السودوكو:',
      steps: [
        'كل صف يجب أن يحتوي على جميع الأرقام',
        'كل عمود يجب أن يحتوي على جميع الأرقام',
        'كل مربع صغير يجب أن يحتوي على جميع الأرقام'
      ]
    };
  }

  generateMemoryHints(testType, sequence) {
    return [
      {
        level: 1,
        text: testType === 'recall' ? 'ركز على تذكر التسلسل' : 'ابحث عن نمط في التسلسل',
        pointsDeduction: 1
      }
    ];
  }

  generateMemoryExplanation(testType, sequence, answer) {
    return {
      text: 'شرح تمرين الذاكرة:',
      steps: [
        `نوع التمرين: ${testType === 'recall' ? 'استدعاء' : 'نمط'}`,
        `الإجابة الصحيحة: ${answer}`
      ]
    };
  }

  generateLogicGridHints(clues) {
    return [
      {
        level: 1,
        text: 'استخدم القرائن لاستبعاد الاحتمالات المستحيلة',
        pointsDeduction: 1
      }
    ];
  }

  generateLogicGridExplanation(solution) {
    return {
      text: 'شرح شبكة المنطق:',
      steps: ['استخدم الاستدلال المنطقي لحل الشبكة']
    };
  }
}

module.exports = IQGamesGenerator;
