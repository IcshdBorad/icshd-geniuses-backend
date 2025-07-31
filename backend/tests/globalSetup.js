const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.BCRYPT_ROUNDS = '1'; // Faster for testing
  
  // Start MongoDB Memory Server
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  // Store the URI and instance for global teardown
  global.__MONGOD__ = mongod;
  global.__MONGO_URI__ = uri;
  
  console.log('🧪 Global test setup completed');
  console.log(`📊 MongoDB Memory Server started at: ${uri}`);
};
