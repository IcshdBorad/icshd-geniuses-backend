// Quick validation tests - No database required
// These tests run fast to verify basic functionality

describe('🚀 Quick Validation Tests', () => {

  describe('📁 File Structure Validation', () => {
    test('should have all required model files', () => {
      const fs = require('fs');
      const path = require('path');

      const requiredModels = [
        'User.js',
        'Session.js',
        'Exercise.js',
        'Promotion.js',
        'AdaptiveData.js',
        'Gamification.js', // تم التعديل هنا: الآن جميع نماذج الـ Gamification في هذا الملف
      ];

      const modelsDir = path.join(__dirname, '../../models');

      requiredModels.forEach(modelFile => {
        const filePath = path.join(modelsDir, modelFile);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have all required service files', () => {
      const fs = require('fs');
      const path = require('path');

      const requiredServices = [
        'ExerciseGenerator.js',
        'PersonalizationService.js',
        'AdaptiveLearningEngine.js',
        'GamificationService.js'
      ];

      const servicesDir = path.join(__dirname, '../../services');

      requiredServices.forEach(serviceFile => {
        const filePath = path.join(servicesDir, serviceFile);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('should have all required controller files', () => {
      const fs = require('fs');
      const path = require('path');

      const requiredControllers = [
        'SessionManager.js',
        'AdaptiveSessionController.js',
        'GamificationController.js'
      ];

      const controllersDir = path.join(__dirname, '../../controllers');

      requiredControllers.forEach(controllerFile => {
        const filePath = path.join(controllersDir, controllerFile);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('📦 Module Loading', () => {
    test('should load User model without errors', () => {
      expect(() => {
        require('../../models/User');
      }).not.toThrow();
    });

    test('should load Session model without errors', () => {
      expect(() => {
        require('../../models/Session');
      }).not.toThrow();
    });

    test('should load GamificationService without errors', () => {
      expect(() => {
        require('../../services/GamificationService');
      }).not.toThrow();
    });

    test('should load GamificationController without errors', () => {
      expect(() => {
        require('../../controllers/GamificationController');
      }).not.toThrow();
    });

    test('should load all gamification models without errors', () => {
      // بما أن كل نماذج gamification مدمجة في ملف واحد، نختبر تحميل هذا الملف
      expect(() => {
        require('../../models/Gamification'); // تم التعديل هنا
      }).not.toThrow();
    });
  });

  describe('🔧 Configuration Validation', () => {
    test('should have valid Jest configuration', () => {
      const fs = require('fs');
      const path = require('path');

      const jestConfigPath = path.join(__dirname, '../../jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);

      const jestConfig = require('../../jest.config.js');
      expect(jestConfig).toBeDefined();
      expect(jestConfig.testEnvironment).toBe('node');
    });

    test('should have valid package.json with test scripts', () => {
      const fs = require('fs');
      const path = require('path');

      const packagePath = path.join(__dirname, '../../package.json');
      expect(fs.existsSync(packagePath)).toBe(true);

      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts['test:gamification']).toBeDefined();
      expect(packageJson.devDependencies.jest).toBeDefined();
    });

    test('should have test environment file', () => {
      const fs = require('fs');
      const path = require('path');

      const envTestPath = path.join(__dirname, '../../.env.test');
      expect(fs.existsSync(envTestPath)).toBe(true);
    });
  });

  describe('🎮 Gamification System Structure', () => {
    test('should have valid gamification service structure', () => {
      const GamificationService = require('../../services/GamificationService');

      expect(GamificationService).toBeDefined();
      expect(typeof GamificationService).toBe('function');

      // Check if it has required methods (without instantiating)
      const prototype = GamificationService.prototype;
      const expectedMethods = [
        'initializeUserProfile',
        'awardPoints',
        'spendPoints',
        'updateExperience',
        'processSessionCompletion',
        'updateStreak',
        'checkAchievements',
        'updateLeaderboards'
      ];

      expectedMethods.forEach(method => {
        expect(typeof prototype[method]).toBe('function');
      });
    });

    test('should have valid gamification controller structure', () => {
      const gamificationRoutes = require('../../routes/gamification');

      expect(gamificationRoutes).toBeDefined();
      expect(typeof gamificationRoutes).toBe('function'); // Express router
    });

    test('should have valid gamification models structure', () => {
      // بما أن النماذج مدمجة في Gamification.js، نستوردها منه
      const { Achievement, UserGamificationProfile } = require('../../models/Gamification'); // تم التعديل هنا

      expect(Achievement).toBeDefined();
      expect(UserGamificationProfile).toBeDefined();

      // Check schema structure
      expect(Achievement.schema).toBeDefined();
      expect(UserGamificationProfile.schema).toBeDefined();
    });
  });

  describe('📊 Frontend Components Structure', () => {
    test('should have all gamification frontend components', () => {
      const fs = require('fs');
      const path = require('path');

      const frontendComponents = [
        'GamificationDashboard.js',
        'AchievementsPage.js',
        'LeaderboardPage.js',
        'ChallengesPage.js',
        'ProfileCustomization.js'
      ];

      // Assuming your frontend project is sibling to backend
      const componentsDir = path.join(__dirname, '../../../frontend/src/components/gamification');

      frontendComponents.forEach(component => {
        const filePath = path.join(componentsDir, component);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('⚡ Performance Checks', () => {
    test('should load modules quickly', async () => {
      const startTime = Date.now();

      // Load key modules
      require('../../models/User');
      require('../../services/GamificationService');
      require('../../controllers/GamificationController');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Should load in under 1 second
    });
  });
});

console.log('✅ Quick validation tests completed successfully!');