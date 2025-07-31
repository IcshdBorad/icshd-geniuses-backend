// backend/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger'); // استخدام الـ logger الذي سنقوم بتعريفه

// دالة الاتصال بقاعدة البيانات MongoDB
const connectDB = async () => {
  try {
    // استخدام MONGO_URI من متغيرات البيئة
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true, // خيارات لضمان التوافق مع أحدث إصدارات MongoDB
      useUnifiedTopology: true,
      // useCreateIndex: true, // لم يعد مدعومًا في Mongoose 6+
      // useFindAndModify: false // لم يعد مدعومًا في Mongoose 6+
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error(`Error: ${err.message}`);
    // الخروج من العملية في حالة فشل الاتصال بقاعدة البيانات
    process.exit(1);
  }
};

module.exports = connectDB;
