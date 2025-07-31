// backend/jest.config.js
const path = require('path');

module.exports = {
  testEnvironment: 'node', // تحديد بيئة الاختبار (Node.js لاختبارات الخلفية)
  rootDir: path.resolve(__dirname), // الدليل الجذري حيث يجب أن يبحث Jest عن الملفات

  // أخبر babel-jest صراحة باستخدام ملف babel.config.js الخاص بك لجميع الملفات المطابقة
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      { configFile: path.resolve(__dirname, 'babel.config.js') }
    ],
  },

  // أنماط تجاهل التحويل المحسنة:
  // هذا النمط يعني: "تجاهل أي شيء في node_modules، إلا إذا كان يحتوي على
  // 'mongodb'، 'mongodb-memory-server'، أو '@mongodb' في مساره."
  transformIgnorePatterns: [
    '/node_modules/(?!.*(mongodb|mongodb-memory-server|@mongodb)/)',
  ],

  moduleDirectories: ['node_modules', '<rootDir>'], // الدلائل التي يجب أن يبحث Jest فيها لحل الوحدات
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], // الملفات التي يتم تشغيلها قبل كل ملف اختبار
  testMatch: [
    '<rootDir>/tests/**/*.test.js', // أنماط ملفات الاختبار التي يجب أن يأخذها Jest في الاعتبار
    '<rootDir>/tests/**/*.spec.js' // أنماط ملفات الاختبار التي يجب أن يأخذها Jest في الاعتبار
  ],
  testPathIgnorePatterns: [
    '/node_modules/', // أنماط الملفات التي يجب أن يتجاهلها Jest أثناء اكتشاف الاختبار
    '<rootDir>/run-tests.js', // أنماط الملفات التي يجب أن يتجاهلها Jest أثناء اكتشاف الاختبار
    '<rootDir>/server.js' // أنماط الملفات التي يجب أن يتجاهلها Jest أثناء اكتشاف الاختبار
  ],

  collectCoverage: true, // تمكين جمع التغطية
  collectCoverageFrom: [ // الملفات التي سيتم جمع التغطية منها
    'controllers/**/*.js',
    'models/**/*.js',
    'services/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js',
    'config/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/server.js'
  ],
  coverageDirectory: 'coverage', // دليل التغطية
  coverageReporters: ['html', 'text', 'lcov'], // تقارير التغطية
  coverageThreshold: { // حدود التغطية
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  // إذا كنت تستخدم وحدات ECMAScript (ESM) صراحة في ملفات الاختبار الخاصة بك
  // ولديك "type": "module" في package.json الخاص بك، قد تحتاج إلى هذا.
  // إذا لم يكن كذلك، أبقيه معلقًا.
  // extensionsToTreatAsEsm: ['.js'],
};