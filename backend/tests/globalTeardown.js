module.exports = async () => {
  // Stop MongoDB Memory Server
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
    console.log('🧹 MongoDB Memory Server stopped');
  }
  
  console.log('🧪 Global test teardown completed');
};
