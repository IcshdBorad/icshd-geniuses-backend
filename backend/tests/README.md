# ICSHD GENIUSES - Test Suite Documentation

## 📋 Overview

This comprehensive test suite ensures the reliability and quality of the ICSHD GENIUSES adaptive learning platform backend. The tests cover all major components including models, services, controllers, and API endpoints with a focus on the gamification system.

## 🏗️ Test Architecture

### Test Types

1. **Unit Tests** (`tests/unit/`)
   - Test individual components in isolation
   - Mock external dependencies
   - Fast execution
   - High coverage

2. **Integration Tests** (`tests/integration/`)
   - Test component interactions
   - Test API endpoints end-to-end
   - Use real database (MongoDB Memory Server)
   - Verify data flow

### Test Structure

```
tests/
├── setup.js                     # Test setup utilities
├── globalSetup.js               # Global test configuration
├── globalTeardown.js            # Global cleanup
├── README.md                    # This documentation
├── unit/
│   ├── models/
│   │   ├── User.test.js         # User model tests
│   │   ├── Session.test.js      # Session model tests
│   │   └── Gamification.test.js # Gamification models tests
│   └── services/
│       └── GamificationService.test.js # Gamification service tests
└── integration/
    └── gamification.integration.test.js # Full API integration tests
```

## 🚀 Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Or install test-specific dependencies
npm install --only=dev
```

### Quick Start

```bash
# Run all tests
node run-tests.js all

# Run with coverage
node run-tests.js all --coverage

# Run specific test types
node run-tests.js unit
node run-tests.js integration
node run-tests.js gamification

# Watch mode for development
node run-tests.js unit --watch
```

### Available Commands

| Command | Description |
|---------|-------------|
| `node run-tests.js all` | Run complete test suite |
| `node run-tests.js unit` | Run unit tests only |
| `node run-tests.js integration` | Run integration tests only |
| `node run-tests.js models` | Run model tests only |
| `node run-tests.js services` | Run service tests only |
| `node run-tests.js gamification` | Run gamification-related tests |

### Options

| Option | Description |
|--------|-------------|
| `--coverage` | Generate coverage report |
| `--watch` | Watch for file changes |
| `--verbose` | Detailed output |
| `--silent` | Minimal output |
| `--ci` | CI/CD mode (no watch) |
| `--help` | Show help information |

## 📊 Test Coverage

### Coverage Goals

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

### Coverage Reports

Coverage reports are generated in multiple formats:

- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-final.json`
- **LCOV**: `coverage/lcov.info`
- **Text**: Console output

```bash
# Generate and view coverage
node run-tests.js all --coverage
npm run coverage:open  # Opens HTML report
```

## 🧪 Test Categories

### 1. Model Tests

**Location**: `tests/unit/models/`

Tests database models, schemas, validation, and methods:

- **User Model** (`User.test.js`)
  - User creation and validation
  - Profile statistics updates
  - Streak calculations
  - Learning analytics
  - Authentication methods

- **Session Model** (`Session.test.js`)
  - Session lifecycle management
  - Exercise handling
  - Statistics calculation
  - Performance tracking

- **Gamification Models** (`Gamification.test.js`)
  - Achievement system
  - Points and transactions
  - Challenges and progress
  - Leaderboards
  - User profiles

### 2. Service Tests

**Location**: `tests/unit/services/`

Tests business logic and service layer:

- **GamificationService** (`GamificationService.test.js`)
  - Points management
  - Experience and leveling
  - Achievement processing
  - Challenge management
  - Leaderboard updates
  - Streak tracking

### 3. Integration Tests

**Location**: `tests/integration/`

Tests complete API workflows:

- **Gamification API** (`gamification.integration.test.js`)
  - User profile endpoints
  - Achievement claiming
  - Challenge participation
  - Leaderboard queries
  - Points and inventory
  - Admin operations

## 🔧 Test Configuration

### Jest Configuration

The test suite uses Jest with the following key configurations:

```javascript
// jest.config.js
{
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Environment Variables

Test environment is configured in `.env.test`:

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key
BCRYPT_ROUNDS=1
DB_NAME=icshd_geniuses_test
LOG_LEVEL=error
```

## 🗄️ Database Testing

### MongoDB Memory Server

Tests use MongoDB Memory Server for:
- Isolated test database
- Fast setup/teardown
- No external dependencies
- Consistent test environment

### Data Management

- **Setup**: Fresh database for each test file
- **Cleanup**: Automatic cleanup between tests
- **Isolation**: Tests don't affect each other
- **Performance**: In-memory database for speed

## 🎯 Test Utilities

### Test Data Generators

```javascript
// Generate test user
const userData = generateTestData.user({
  username: 'custom_user',
  role: 'student'
});

// Generate test achievement
const achievementData = generateTestData.achievement({
  category: 'accuracy',
  type: 'gold'
});
```

### Mock Authentication

```javascript
// Mock user authentication
app.use('/api', mockAuth);

// Mock admin authentication
app.use('/api/admin', mockAdminAuth);
```

### Test Helpers

```javascript
// Wait for async operations
await testUtils.wait(100);

// Generate random data
const randomStr = testUtils.randomString(10);
const randomNum = testUtils.randomNumber(1, 100);

// Validate object structure
const isValid = testUtils.validateStructure(obj, ['id', 'name']);
```

## 📈 Performance Testing

### Performance Benchmarks

Tests include performance validations:

- API response times < 1000ms
- Database operations < 500ms
- Large dataset handling
- Concurrent request processing

### Load Testing

```javascript
// Example: Concurrent requests test
const requests = Array(10).fill().map(() => 
  request(app).get('/api/gamification/profile')
);
const responses = await Promise.all(requests);
```

## 🐛 Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
node run-tests.js unit --debug

# Or use Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Common Issues

1. **Database Connection**
   - Ensure MongoDB Memory Server starts correctly
   - Check for port conflicts

2. **Timeout Issues**
   - Increase test timeout in Jest config
   - Check for hanging promises

3. **Memory Leaks**
   - Verify proper cleanup in afterEach/afterAll
   - Close database connections

## 📋 Test Checklist

Before committing code, ensure:

- [ ] All tests pass
- [ ] Coverage meets thresholds (80%+)
- [ ] No console errors or warnings
- [ ] New features have corresponding tests
- [ ] Integration tests cover API changes
- [ ] Performance tests pass

## 🔄 Continuous Integration

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    node run-tests.js all --ci --coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./coverage/lcov.info
```

### Test Reports

- **Jest HTML Reporter**: Detailed test results
- **Coverage Reports**: Code coverage analysis
- **Sonar Reports**: Code quality metrics

## 📚 Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow AAA pattern
3. **Single Responsibility**: One assertion per test
4. **Independent Tests**: No test dependencies
5. **Mock External Services**: Isolate units under test

### Test Organization

1. **Group Related Tests**: Use `describe` blocks
2. **Setup/Teardown**: Use `beforeEach`/`afterEach`
3. **Test Data**: Use factories and generators
4. **Error Cases**: Test both success and failure paths

### Performance

1. **Fast Tests**: Keep unit tests under 100ms
2. **Parallel Execution**: Use Jest's parallel features
3. **Selective Testing**: Run only affected tests during development
4. **Resource Cleanup**: Prevent memory leaks

## 🆘 Troubleshooting

### Common Solutions

**Tests hanging:**
```bash
# Check for open handles
node run-tests.js unit --detectOpenHandles
```

**Memory issues:**
```bash
# Increase Node.js memory
node --max-old-space-size=4096 run-tests.js all
```

**Database connection errors:**
```bash
# Clear Jest cache
npm run test:clear
```

## 📞 Support

For test-related issues:

1. Check this documentation
2. Review test logs and error messages
3. Verify environment setup
4. Check for recent code changes affecting tests

## 🔗 Related Documentation

- [API Documentation](../docs/api.md)
- [Database Schema](../docs/database.md)
- [Gamification System](../docs/gamification.md)
- [Development Guide](../docs/development.md)
