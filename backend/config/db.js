const mongoose = require('mongoose');
const logger = require('../utils/logger'); // استخدام الـ logger الذي قمنا بتعريفه

// دالة الاتصال بقاعدة البيانات MongoDB
const connectDB = async () => {
    try {
        // استخدام MONGO_URI من متغيرات البيئة
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, // خيارات لضمان التوافق مع أحدث إصدارات MongoDB
            useUnifiedTopology: true,
            // useCreateIndex و useFindAndModify لم يعدا مدعومين في Mongoose 6+
            // إذا كنت تستخدم إصدار Mongoose أقدم، قد تحتاج إلى إعادتهما
            // useCreateIndex: true,
            // useFindAndModify: false
        });

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        logger.error(`Error: ${err.message}`);
        // الخروج من العملية في حالة فشل الاتصال بقاعدة البيانات
        process.exit(1);
    }
};

module.exports = connectDB;