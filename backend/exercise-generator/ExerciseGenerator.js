/**
 * Base Exercise Generator for ICSHD GENIUSES
 * Provides common exercise generation functionalities.
 */

// قم باستيراد Exercise Model إذا كان ضروريًا للفئة الأساسية
// const Exercise = require('../models/Exercise'); 

class ExerciseGenerator {
    constructor() {
        // يمكنك وضع أي خصائص أو إعدادات أساسية هنا
        // على سبيل المثال، دوال المساعدة أو خصائص مشتركة
    }

    /**
     * Placeholder methods for specific exercise generation logic.
     * These methods would contain the actual implementation for generating
     * problems, answers, steps, etc., for different curricula and types.
     * AdaptiveExerciseGenerator will call these or override them.
     */

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

    generateMultiplicationBy11(range) { return this.generateBasicVedicMultiplication(range); }
    generateAllFrom9(range) { return this.generateBasicVedicMultiplication(range); }
    generateVerticallyCrosswise(range) { return this.generateBasicVedicMultiplication(range); }


    generateSimplePattern(complexity) {
        const sequence = [2, 4, 6, 8];
        return {
            question: `ما هو الرقم التالي في التسلسل: ${sequence.join(', ')}, ?`,
            answer: 10,
            pattern: 'زيادة بمقدار 2',
            explanation: 'كل رقم يزيد عن السابق بمقدار 2'
        };
    }

    generateMediumPattern(complexity) { return this.generateSimplePattern(complexity); }
    generateComplexPattern(complexity) { return this.generateSimplePattern(complexity); }
    generateSequence(complexity) { return this.generateSimplePattern(complexity); }
    generateBasicLogic(complexity) { return this.generateSimplePattern(complexity); }
    generateReasoning(complexity) { return this.generateSimplePattern(complexity); }

    generateBasicMemoryGame(difficulty) {
        const sequence = Array.from({length: difficulty + 2}, () => Math.floor(Math.random() * 9) + 1);
        return {
            question: `احفظ هذا التسلسل: ${sequence.join(' - ')}`,
            answer: sequence.join(''),
            gameData: { sequence, displayTime: 3000 },
            instructions: 'احفظ التسلسل ثم أدخله'
        };
    }

    generateMediumMemoryGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
    generateAttentionGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
    generateSpatialGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }
    generateReasoningGame(difficulty) { return this.generateBasicMemoryGame(difficulty); }

    // Hint generation methods (يمكن وضعها في ملف utility أو هنا)
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
            squares: 'استخدم طريقة المربعات الفيدية', // كانت سابقا قاعدة a²-b²
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

    // Utility functions (يمكن نقلها إلى ملف utility إذا أصبحت كبيرة)
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

    generateBalancedExercises(curriculum, count, level, targetDifficulty, learningStyle, progression) {
        return this.generateTypeSpecificExercises(curriculum, 'mixed', count, level, targetDifficulty, learningStyle, progression);
    }
}

module.exports = ExerciseGenerator;