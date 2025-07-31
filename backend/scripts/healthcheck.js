#!/usr/bin/env node

/**
 * Health Check Script for ICSHD GENIUSES
 * Used by Docker and monitoring systems to verify application health
 */

const http = require('http');
const mongoose = require('mongoose');

const PORT = process.env.API_PORT || 3001;
const HOST = process.env.API_HOST || 'localhost';

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 5000, // 5 seconds timeout
  retries: 3,
  checks: {
    api: true,
    database: true,
    memory: true,
    disk: false // Disable disk check in container
  }
};

/**
 * Check API endpoint health
 */
async function checkAPI() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: HEALTH_CHECK_CONFIG.timeout
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        resolve({ status: 'healthy', message: 'API responding' });
      } else {
        reject(new Error(`API returned status ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(new Error(`API check failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('API check timeout'));
    });

    req.end();
  });
}

/**
 * Check database connection
 */
async function checkDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    // Simple ping to verify connection
    await mongoose.connection.db.admin().ping();
    
    return { status: 'healthy', message: 'Database connected' };
  } catch (error) {
    throw new Error(`Database check failed: ${error.message}`);
  }
}

/**
 * Check memory usage
 */
function checkMemory() {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  const memoryUsagePercent = (usedMem / totalMem) * 100;

  if (memoryUsagePercent > 90) {
    throw new Error(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
  }

  return {
    status: 'healthy',
    message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
    details: {
      heapUsed: Math.round(usedMem / 1024 / 1024) + ' MB',
      heapTotal: Math.round(totalMem / 1024 / 1024) + ' MB'
    }
  };
}

/**
 * Check disk space (for non-container environments)
 */
function checkDisk() {
  const fs = require('fs');
  const path = require('path');

  try {
    const stats = fs.statSync(path.resolve('./'));
    // This is a simplified check - in production you might want to use a library
    return { status: 'healthy', message: 'Disk accessible' };
  } catch (error) {
    throw new Error(`Disk check failed: ${error.message}`);
  }
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  const results = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
    uptime: process.uptime(),
    version: process.env.APP_VERSION || '1.0.0'
  };

  const checks = [];

  // API Check
  if (HEALTH_CHECK_CONFIG.checks.api) {
    checks.push(
      checkAPI()
        .then(result => ({ name: 'api', ...result }))
        .catch(error => ({ name: 'api', status: 'unhealthy', message: error.message }))
    );
  }

  // Database Check
  if (HEALTH_CHECK_CONFIG.checks.database) {
    checks.push(
      checkDatabase()
        .then(result => ({ name: 'database', ...result }))
        .catch(error => ({ name: 'database', status: 'unhealthy', message: error.message }))
    );
  }

  // Memory Check
  if (HEALTH_CHECK_CONFIG.checks.memory) {
    checks.push(
      Promise.resolve()
        .then(() => checkMemory())
        .then(result => ({ name: 'memory', ...result }))
        .catch(error => ({ name: 'memory', status: 'unhealthy', message: error.message }))
    );
  }

  // Disk Check
  if (HEALTH_CHECK_CONFIG.checks.disk) {
    checks.push(
      Promise.resolve()
        .then(() => checkDisk())
        .then(result => ({ name: 'disk', ...result }))
        .catch(error => ({ name: 'disk', status: 'unhealthy', message: error.message }))
    );
  }

  // Wait for all checks to complete
  const checkResults = await Promise.all(checks);

  // Process results
  let overallHealthy = true;
  checkResults.forEach(check => {
    results.checks[check.name] = {
      status: check.status,
      message: check.message,
      details: check.details || null
    };

    if (check.status !== 'healthy') {
      overallHealthy = false;
    }
  });

  results.status = overallHealthy ? 'healthy' : 'unhealthy';
  return results;
}

/**
 * Main execution
 */
async function main() {
  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState === 0) {
      const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/icshd_geniuses_prod';
      await mongoose.connect(DB_URI);
    }

    const healthResults = await runHealthChecks();

    if (healthResults.status === 'healthy') {
      console.log(JSON.stringify(healthResults, null, 2));
      process.exit(0);
    } else {
      console.error(JSON.stringify(healthResults, null, 2));
      process.exit(1);
    }
  } catch (error) {
    console.error(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    }, null, 2));
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Health check received SIGTERM, exiting...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Health check received SIGINT, exiting...');
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runHealthChecks,
  checkAPI,
  checkDatabase,
  checkMemory,
  checkDisk
};
