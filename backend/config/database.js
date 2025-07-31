/**
 * Database Configuration for ICSHD GENIUSES
 * Supports both MongoDB and MySQL
 */

const mongoose = require('mongoose');
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'mongodb';
    this.mongoConnection = null;
    this.sequelizeConnection = null;
  }

  /**
   * Connect to MongoDB
   */
  async connectMongoDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/icshd_geniuses';
      
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      this.mongoConnection = mongoose.connection;
      
      // Event listeners
      this.mongoConnection.on('connected', () => {
        logger.info('✅ MongoDB connected successfully');
      });

      this.mongoConnection.on('error', (err) => {
        logger.error('❌ MongoDB connection error:', err);
      });

      this.mongoConnection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
      });

      return this.mongoConnection;
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  /**
   * Connect to MySQL using Sequelize
   */
  async connectMySQL() {
    try {
      this.sequelizeConnection = new Sequelize({
        host: process.env.MYSQL_HOST || 'localhost',
        port: process.env.MYSQL_PORT || 3306,
        database: process.env.MYSQL_DATABASE || 'icshd_geniuses',
        username: process.env.MYSQL_USERNAME || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        dialect: 'mysql',
        logging: (msg) => logger.debug(msg),
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          freezeTableName: true
        }
      });

      // Test the connection
      await this.sequelizeConnection.authenticate();
      logger.info('✅ MySQL connected successfully');

      return this.sequelizeConnection;
    } catch (error) {
      logger.error('Failed to connect to MySQL:', error);
      throw error;
    }
  }

  /**
   * Connect to the configured database
   */
  async connectDatabase() {
    if (this.dbType === 'mongodb') {
      return await this.connectMongoDB();
    } else if (this.dbType === 'mysql') {
      return await this.connectMySQL();
    } else {
      throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  /**
   * Close database connections
   */
  async closeConnections() {
    try {
      if (this.mongoConnection) {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
      }

      if (this.sequelizeConnection) {
        await this.sequelizeConnection.close();
        logger.info('MySQL connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }

  /**
   * Get the active database connection
   */
  getConnection() {
    if (this.dbType === 'mongodb') {
      return this.mongoConnection;
    } else if (this.dbType === 'mysql') {
      return this.sequelizeConnection;
    }
    return null;
  }
}

// Export singleton instance
const dbConfig = new DatabaseConfig();

module.exports = {
  connectDatabase: () => dbConfig.connectDatabase(),
  closeConnections: () => dbConfig.closeConnections(),
  getConnection: () => dbConfig.getConnection(),
  dbType: dbConfig.dbType
};
