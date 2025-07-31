#!/usr/bin/env node

// ** هذا السطر للتصحيح فقط. سيساعدنا على التأكد من أن النص البرمجي بدأ فعلاً.**
console.log("DEBUG: run-tests.js started!");

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Function to convert glob pattern to a regex string compatible with --testPathPattern
function globToRegex(globPattern) {
    // التحقق مما إذا كان النمط يشير إلى ملف واحد محدد
    // هذا الشرط يعالج الحالات مثل 'tests/unit/models/Gamification.test.js'
    if (globPattern.includes('/') && (globPattern.endsWith('.js') || globPattern.endsWith('.ts'))) {
        // إذا كان مسارًا لملف محدد، فلنحول المسار إلى تنسيق متوافق مع Jest/Windows/WSL
        // باستخدام path.join للحفاظ على الشرطة المائلة الصحيحة للنظام
        // ثم نقوم بهروب الأحرف الخاصة (مثل النقطة) لتكون تعبيرًا عاديًا
        // المسار المطلق أفضل هنا لتجنب مشاكل CWD في Jest
        const absolutePath = path.join(__dirname, globPattern);
        
        // الهروب من الأحرف الخاصة (خاصة النقاط) لإنشاء تعبير عادي
        // نحتاج أيضاً إلى التأكد من أن الشرطة المائلة العكسية يتم التعامل معها بشكل صحيح في Windows paths
        let regexString = absolutePath.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        
        // For Windows paths, replace backslashes with double backslashes for regex literal,
        // or ensure they are escaped if path.sep is '\'.
        // This is crucial for matching paths like C:\Users\... in regex.
        if (path.sep === '\\') { // If running on Windows directly or WSL translating to Windows paths
            regexString = regexString.replace(/\\/g, '\\\\');
        }

        return `^${regexString}$`; // تأكيد التطابق التام من البداية للنهاية
    }

    // الطريقة الأصلية لأنماط glob المعقدة (مثل **, *)
    // هذا الجزء يتعامل مع أنماط مثل 'tests/**/*.test.js'
    let regexString = globPattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

    // Convert /**/ (zero or more directories) to regex
    regexString = regexString.replace(/\/\*\*\//g, '(?:[^/]+/)*'); 

    // Convert * (zero or more non-slash characters) to regex
    regexString = regexString.replace(/\*/g, '[^/]*');

    // Convert ? (any single character) to regex
    regexString = regexString.replace(/\?/g, '.');
    
    return `^${regexString}$`;
}


// Test configurations
const testConfigs = {
  unit: {
    name: 'Unit Tests',
    pattern: 'tests/unit/**/*.test.js',
    description: 'Tests individual components in isolation'
  },
  integration: {
    name: 'Integration Tests',
    pattern: 'tests/integration/**/*.test.js',
    description: 'Tests component interactions and API endpoints'
  },
  models: {
    name: 'Model Tests',
    pattern: 'tests/unit/models/**/*.test.js',
    description: 'Tests database models and schemas'
  },
  services: {
    name: 'Service Tests',
    pattern: 'tests/unit/services/**/*.test.js',
    description: 'Tests business logic services'
  },
  gamification: {
    name: 'Gamification Tests',
    // تأكد من أن هذا المسار يطابق تماماً اسم الملف الفعلي وحالة الأحرف
    pattern: 'tests/unit/models/Gamification.test.js',
    description: 'Tests gamification system components'
  },
  all: {
    name: 'All Tests',
    pattern: 'tests/**/*.test.js',
    description: 'Runs complete test suite'
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const testType = args[0] || 'all';
const options = args.slice(1);

// Validate test type
if (!testConfigs[testType]) {
  console.error(`${colors.red}❌ Invalid test type: ${testType}${colors.reset}`);
  console.log(`${colors.yellow}Available test types:${colors.reset}`);
  Object.keys(testConfigs).forEach(key => {
    const config = testConfigs[key];
    console.log(`  ${colors.cyan}${key}${colors.reset} - ${config.description}`);
  });
  if (!options.includes('--help')) {
      process.exit(1);
  }
}

// Check if required dependencies are installed
const requiredPackages = [
  'jest',
  'mongodb-memory-server',
  'supertest'
];

function checkDependencies() {
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`${colors.red}❌ package.json not found${colors.reset}`);
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const missingPackages = requiredPackages.filter(pkg => !allDeps[pkg]);
  
  if (missingPackages.length > 0) {
    console.error(`${colors.red}❌ Missing required packages:${colors.reset}`);
    missingPackages.forEach(pkg => console.log(`  - ${pkg}`));
    console.log(`${colors.yellow}Run: npm install${colors.reset}`);
    process.exit(1);
  }
}

// Create test environment file
function createTestEnv() {
  const testEnvPath = path.join(__dirname, '.env.test');
  const testEnvContent = `
# Test Environment Configuration
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-only
BCRYPT_ROUNDS=1
DB_NAME=icshd_geniuses_test
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
LOG_LEVEL=error
`.trim();

  if (!fs.existsSync(testEnvPath)) {
    fs.writeFileSync(testEnvPath, testEnvContent);
    console.log(`${colors.green}✅ Created .env.test file${colors.reset}`);
  }
}

// Run tests
function runTests() {
  const config = testConfigs[testType];
  
  console.log(`${colors.bright}${colors.blue}🧪 Running ${config.name}${colors.reset}`);
  console.log(`${colors.cyan}📝 ${config.description}${colors.reset}`);
  console.log(`${colors.yellow}📂 Pattern: ${config.pattern}${colors.reset}\n`);

  // Build Jest command
  const jestArgs = [
    '--config', 'jest.config.js',
    '--testPathPattern', globToRegex(config.pattern)
  ];

  // Add additional options
  if (options.includes('--watch')) {
    jestArgs.push('--watch');
  }
  
  if (options.includes('--coverage')) {
    jestArgs.push('--coverage');
  }
  
  if (options.includes('--verbose')) {
    jestArgs.push('--verbose');
  }
  
  if (options.includes('--silent')) {
    jestArgs.push('--silent');
  }

  if (options.includes('--ci')) {
    jestArgs.push('--ci', '--watchAll=false');
  }

  // --- استخدام المسار المطلق لـ Jest ---
  const jestExecutable = path.join(__dirname, 'node_modules', '.bin', 'jest');
  
  console.log(`${colors.magenta}Running command: ${jestExecutable} ${jestArgs.join(' ')}${colors.reset}\n`);

  // Spawn Jest process
  const jestProcess = spawn(jestExecutable, jestArgs, {
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'test' }
  });

  jestProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`\n${colors.green}✅ Tests completed successfully!${colors.reset}`);
      
      // Show coverage report location if coverage was generated
      if (options.includes('--coverage')) {
        console.log(`${colors.cyan}📊 Coverage report: ./coverage/lcov-report/index.html${colors.reset}`);
      }
    } else {
      console.log(`\n${colors.red}❌ Tests failed with exit code ${code}${colors.reset}`);
      process.exit(code);
    }
  });

  jestProcess.on('error', (error) => {
    console.error(`${colors.red}❌ Failed to start tests: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

// Show help
function showHelp() {
  console.log(`${colors.bright}ICSHD GENIUSES Test Runner${colors.reset}\n`);
  
  console.log(`${colors.yellow}Usage:${colors.reset}`);
  console.log(`  node run-tests.js [test-type] [options]\n`);
  
  console.log(`${colors.yellow}Test Types:${colors.reset}`);
  Object.keys(testConfigs).forEach(key => {
    const config = testConfigs[key];
    console.log(`  ${colors.cyan}${key.padEnd(12)}${colors.reset} - ${config.description}`);
  });
  
  console.log(`\n${colors.yellow}Options:${colors.reset}`);
  console.log(`  ${colors.cyan}--watch${colors.reset}     - Watch for file changes`);
  console.log(`  ${colors.cyan}--coverage${colors.reset}  - Generate coverage report`);
  console.log(`  ${colors.cyan}--verbose${colors.reset}   - Verbose output`);
  console.log(`  ${colors.cyan}--silent${colors.reset}    - Silent output`);
  console.log(`  ${colors.cyan}--ci${colors.reset}        - CI mode (no watch)`);
  console.log(`  ${colors.cyan}--help${colors.reset}      - Show this help\n`);
  
  console.log(`${colors.yellow}Examples:${colors.reset}`);
  console.log(`  ${colors.green}node run-tests.js unit${colors.reset}            - Run unit tests`);
  console.log(`  ${colors.green}node run-tests.js gamification --coverage${colors.reset} - Run gamification tests with coverage`);
  console.log(`  ${colors.green}node run-tests.js all --watch${colors.reset}             - Run all tests in watch mode`);
  console.log(`  ${colors.green}node run-tests.js integration --ci${colors.reset}      - Run integration tests in CI mode`);
}

// Main execution
function main() {
  if (testType === '--help' || options.includes('--help')) {
    showHelp();
    return;
  }

  console.log(`${colors.bright}${colors.magenta}🚀 ICSHD GENIUSES Test Runner${colors.reset}\n`);
  
  // Pre-flight checks
  checkDependencies();
  createTestEnv();
  
  // Run tests
  runTests();
}

// Handle process signals
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}⚠️  Test execution interrupted${colors.reset}`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n${colors.yellow}⚠️  Test execution terminated${colors.reset}`);
  process.exit(0);
});

// Run main function
main();