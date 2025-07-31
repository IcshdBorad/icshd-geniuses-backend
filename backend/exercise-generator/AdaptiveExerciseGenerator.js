/**
 * Adaptive Exercise Generator for ICSHD GENIUSES
 * Extends the base ExerciseGenerator to provide adaptive learning capabilities
 * based on user performance, difficulty levels, and learning styles.
 */

const ExerciseGenerator = require('./ExerciseGenerator'); // استيراد الفئة الأساسية

class AdaptiveExerciseGenerator extends ExerciseGenerator {
    constructor(userPerformance = {}, learningStyle = 'visual') {
        super(); // استدعاء مُنشئ الفئة الأساسية
        this.userPerformance = userPerformance; // بيانات أداء المستخدم
        this.learningStyle = learningStyle; // أسلوب تعلم المستخدم
        this.difficultyLevels = { // تعريف مستويات الصعوبة
            easy: { minRange: 1, maxRange: 10, timeMultiplier: 1.2 },
            medium: { minRange: 10, maxRange: 100, timeMultiplier: 1.0 },
            hard: { minRange: 100, maxRange: 1000, timeMultiplier: 0.8 }
        };
        // يمكن إضافة المزيد من الخصائص المتعلقة بالتكيف هنا
    }

    /**
     * تحديث أداء المستخدم.
     * @param {string} exerciseType - نوع التمرين (مثل 'addition', 'multiplication', 'vedic', etc.)
     * @param {boolean} isCorrect - هل كانت الإجابة صحيحة؟
     * @param {number} timeTaken - الوقت المستغرق للإجابة (بالثواني)
     * @param {string} curriculum - المنهج الدراسي (مثل 'basic-math', 'vedic-math', 'logic')
     */
    updatePerformance(exerciseType, isCorrect, timeTaken, curriculum) {
        if (!this.userPerformance[curriculum]) {
            this.userPerformance[curriculum] = {};
        }
        if (!this.userPerformance[curriculum][exerciseType]) {
            this.userPerformance[curriculum][exerciseType] = { correct: 0, total: 0, avgTime: 0, lastScore: 0 };
        }

        const data = this.userPerformance[curriculum][exerciseType];
        data.total++;
        if (isCorrect) {
            data.correct++;
        }

        // حساب متوسط الوقت
        data.avgTime = (data.avgTime * (data.total - 1) + timeTaken) / data.total;

        // يمكن إضافة منطق معقد لحساب lastScore أو مستوى إتقان هنا
        data.lastScore = (data.correct / data.total) * 100;
        console.log(`Updated performance for ${curriculum} - ${exerciseType}: ${JSON.stringify(data)}`);
    }

    /**
     * تحديد مستوى الصعوبة الحالي بناءً على أداء المستخدم.
     * @param {string} curriculum - المنهج الدراسي
     * @param {string} exerciseType - نوع التمرين
     * @returns {string} - 'easy', 'medium', or 'hard'
     */
    getCurrentDifficulty(curriculum, exerciseType) {
        const performance = this.userPerformance[curriculum]?.[exerciseType];
        if (!performance || performance.total < 5) { // عدد قليل من المحاولات، ابدأ بالمتوسط
            return 'medium';
        }

        const accuracy = performance.correct / performance.total;
        const avgTimeFactor = performance.avgTime / 30; // 30 ثانية كمتوسط للقياس

        if (accuracy > 0.85 && avgTimeFactor < 1.2) {
            return 'hard'; // أداء ممتاز وسرعة
        } else if (accuracy < 0.6 || avgTimeFactor > 1.8) {
            return 'easy'; // أداء ضعيف أو بطيء جداً
        } else {
            return 'medium'; // أداء متوسط
        }
    }

    /**
     * توليد تمرين تكيفي.
     * @param {string} curriculum - المنهج الدراسي (مثل 'basic-math', 'vedic-math', 'logic', 'iq-games')
     * @param {string} exerciseType - نوع التمرين المطلوب (مثال: 'addition', 'multiplicationBy11', 'generateSequence', 'generateMemoryGame')
     * @returns {object} - كائن التمرين الذي تم توليده
     */
    generateAdaptiveExercise(curriculum, exerciseType) {
        const currentDifficulty = this.getCurrentDifficulty(curriculum, exerciseType);
        const difficultyConfig = this.difficultyLevels[currentDifficulty];

        let exercise;
        let range = [difficultyConfig.minRange, difficultyConfig.maxRange];

        // اختيار دالة التوليد المناسبة من الفئة الأساسية (ExerciseGenerator)
        switch (exerciseType) {
            case 'addition':
                exercise = this.generateAdditionProblem(range, 2); // 2 digits as default
                break;
            case 'subtraction':
                exercise = this.generateSubtractionProblem(range, 2);
                break;
            case 'multiplication':
                exercise = this.generateMultiplicationProblem(range, 2);
                break;
            case 'division':
                exercise = this.generateDivisionProblem(range, 2);
                break;
            case 'mixed':
                exercise = this.generateMixedProblem(range, 2);
                break;
            case 'basicVedicMultiplication':
                exercise = this.generateBasicVedicMultiplication(range);
                break;
            case 'vedicSquares':
                exercise = this.generateVedicSquares(range);
                break;
            case 'multiplicationBy11':
                exercise = this.generateMultiplicationBy11(range);
                break;
            case 'allFrom9':
                exercise = this.generateAllFrom9(range);
                break;
            case 'verticallyCrosswise':
                exercise = this.generateVerticallyCrosswise(range);
                break;
            case 'generateSimplePattern':
                exercise = this.generateSimplePattern(currentDifficulty);
                break;
            case 'generateMediumPattern':
                exercise = this.generateMediumPattern(currentDifficulty);
                break;
            case 'generateComplexPattern':
                exercise = this.generateComplexPattern(currentDifficulty);
                break;
            case 'generateSequence':
                exercise = this.generateSequence(currentDifficulty);
                break;
            case 'generateBasicLogic':
                exercise = this.generateBasicLogic(currentDifficulty);
                break;
            case 'generateReasoning':
                exercise = this.generateReasoning(currentDifficulty);
                break;
            case 'generateBasicMemoryGame':
                exercise = this.generateBasicMemoryGame(currentDifficulty); // Use difficulty for 'difficulty' param
                break;
            case 'generateMediumMemoryGame':
                exercise = this.generateMediumMemoryGame(currentDifficulty);
                break;
            case 'generateAttentionGame':
                exercise = this.generateAttentionGame(currentDifficulty);
                break;
            case 'generateSpatialGame':
                exercise = this.generateSpatialGame(currentDifficulty);
                break;
            case 'generateReasoningGame':
                exercise = this.generateReasoningGame(currentDifficulty);
                break;
            default:
                // في حالة نوع تمرين غير معروف أو افتراضي
                console.warn(`Unknown exercise type: ${exerciseType}. Generating a default addition problem.`);
                exercise = this.generateAdditionProblem([1, 10], 2);
        }

        // إضافة معلومات التكيف إلى التمرين
        exercise.difficulty = currentDifficulty;
        exercise.timeLimit = Math.round(this.calculateTimeLimit(difficultyConfig.timeMultiplier, exerciseType));
        exercise.hint = this.generateHintForExercise(curriculum, exerciseType, exercise); // توليد تلميح بناءً على أسلوب التعلم
        exercise.learningStyleHint = this.getLearningStyleHint(this.learningStyle); // تلميح بناءً على أسلوب التعلم العام

        return exercise;
    }

    /**
     * توليد تلميح خاص بالتمرين بناءً على المنهج ونوع التمرين.
     * يستخدم دوال توليد التلميحات من ExerciseGenerator.
     * @param {string} curriculum
     * @param {string} exerciseType
     * @param {object} exercise
     * @returns {string}
     */
    generateHintForExercise(curriculum, exerciseType, exercise) {
        if (curriculum === 'soroban-math') {
            return this.generateSorobanHint(exerciseType, exercise.question);
        } else if (curriculum === 'vedic-math') {
            return this.generateVedicHint(exerciseType, exercise.question);
        } else if (curriculum === 'logic-patterns') {
            return this.generateLogicHint(exerciseType, exercise.pattern);
        } else if (curriculum === 'iq-games') {
            return this.generateIQGameHint(exerciseType, exercise.gameData);
        }
        return 'فكر جيداً في السؤال!'; // تلميح عام
    }

    /**
     * تقديم تلميحات إضافية بناءً على أسلوب التعلم المفضل للمستخدم.
     * @param {string} style - أسلوب التعلم ('visual', 'auditory', 'kinesthetic')
     * @returns {string}
     */
    getLearningStyleHint(style) {
        switch (style) {
            case 'visual':
                return 'حاول تصور المشكلة في ذهنك أو ارسمها.';
            case 'auditory':
                return 'حاول نطق المشكلة بصوت عالٍ أو اشرحها لنفسك.';
            case 'kinesthetic':
                return 'حاول استخدام حركات اليد أو الأصابع لحل المشكلة.';
            default:
                return ''; // لا يوجد تلميح محدد
        }
    }
}

module.exports = AdaptiveExerciseGenerator;