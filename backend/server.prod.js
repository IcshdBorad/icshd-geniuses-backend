// backend/server.js

require('dotenv').config(); // تأكد من تحميل متغيرات البيئة من ملف .env

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan'); // لأغراض التسجيل في البيئة غير الإنتاجية
const logger = require('./utils/logger'); // استيراد الـ logger الذي أنشأناه

// استيراد المسارات (Routes)
const authRoutes = require('./routes/auth'); // افترض أن لديك مسارات مصادقة
const sessionRoutes = require('./routes/session'); // افترض أن لديك مسارات للجلسات
const gamificationRoutes = require('./routes/gamification'); // مسارات نظام الـ Gamification

const app = express();

// استخدام Helmet لحماية التطبيق من بعض الثغرات المعروفة
app.use(helmet());

// تفعيل CORS للسماح بطلبات من نطاقات مختلفة (للتطوير)
// في بيئة الإنتاج، قد تحتاج إلى تحديد نطاقات محددة
app.use(cors());

// Rate Limiting لحماية من هجمات القوة الغاشمة (Brute-Force) و DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // حد أقصى 100 طلب لكل IP خلال فترة 15 دقيقة
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use(limiter);

// Body parser، لقراءة JSON من req.body
app.use(express.json({ limit: '10kb' })); // يحد من حجم طلبات JSON إلى 10 كيلوبايت

// Data sanitization ضد NoSQL query injection
app.use(mongoSanitize());

// Data sanitization ضد XSS (Cross-site scripting)
app.use(xss());

// منع تلوث معلمة HTTP (HTTP Parameter Pollution)
app.use(hpp());

// Middlewares للـ Logging (باستخدام Morgan في بيئة التطوير و Pino في جميع البيئات)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// دمج logger Pino مع Express
app.use((req, res, next) => {
  req.log = logger; // لجعل الـ logger متاحًا في req.log في أي مسار أو middleware
  next();
});

// توصيل بقاعدة البيانات MongoDB
const DB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cascadeGeniuses';
mongoose.connect(DB_URI)
  .then(() => logger.info('MongoDB Connected...'))
  .catch(err => {
    logger.error(`MongoDB connection error: ${err.message}`);
    process.exit(1); // إنهاء العملية إذا فشل الاتصال بقاعدة البيانات
  });

// تعريف المسارات (Routes)
app.use('/api/auth', authRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/gamification', gamificationRoutes);

// مسار رئيسي بسيط (للتأكد من أن الخادم يعمل)
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Middlewares لمعالجة الأخطاء (يجب أن تكون في النهاية)
// Middleware للأخطاء 404
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Middleware لمعالجة الأخطاء العامة
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  logger.error(err.message, { stack: err.stack, path: req.originalUrl }); // استخدام الـ logger لتسجيل الأخطاء
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// التعامل مع الوعود المرفوضة غير المعالجة (Unhandled Promise Rejections)
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  // إغلاق الخادم والخروج من العملية
  server.close(() => process.exit(1));
});

module.exports = app; // تصدير التطبيق للاختبارات