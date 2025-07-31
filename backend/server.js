const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); // استيراد مكتبة CORS
const connectDB = require('./config/db'); // ملف الاتصال بقاعدة البيانات
const logger = require('./utils/logger'); // ملف الـ logger

// تحميل متغيرات البيئة من ملف .env
dotenv.config({ path: './.env' });

// الاتصال بقاعدة البيانات
connectDB();

const app = express();

// تكوين CORS للسماح بالطلبات من نطاق ووردبريس الخاص بك
// استبدل 'https://icshd.net' بنطاق موقع ووردبريس الفعلي الخاص بك
app.use(cors({
    origin: process.env.WORDPRESS_URL || 'http://localhost:8080', // <-- هام: استخدم متغير بيئة أو URL الافتراضي لووردبريس
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// مسار أساسي لاختبار أن الـ API يعمل
// عند إرسال طلب GET إلى http://your-api-url.com/
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Body parser - يسمح للخادم بفهم بيانات JSON المرسلة في الطلبات
app.use(express.json());

// تعريف مسارات الـ API
// هذه الأسطر تقوم بربط المسارات الأساسية (مثل /api/v1/auth) بملفات الـ routes الخاصة بها.
// تأكد من أن هذه الأسطر غير معلقة لتفعيل المسارات.
app.use('/api/v1/auth', require('./routes/auth')); // لتفعيل مسارات المصادقة (التسجيل، تسجيل الدخول)
// قم بفك التعليق عن المسارات الأخرى بمجرد إنشائك لملفات routes/adaptive.js, routes/assessment.js, etc.
// app.use('/api/v1/adaptive', require('./routes/adaptive')); 
// app.use('/api/v1/assessment', require('./routes/assessment'));
// app.use('/api/v1/gamification', require('./routes/gamification'));
// app.use('/api/v1/reports', require('./routes/reports'));
// app.use('/api/v1/sessions', require('./routes/sessions'));

// هذا الجزء يخدم ملفات الواجهة الأمامية (frontend) في وضع الإنتاج
// إذا كان لديك واجهة أمامية React/Angular/Vue في مجلد 'client' داخل 'backend'
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));

    app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
    );
}

// تحديد المنفذ الذي سيعمل عليه الخادم، ويستخدم PORT من ملف .env أو الافتراضي 5000
const PORT = process.env.PORT || 5000;

// بدء تشغيل الخادم والاستماع للطلبات
const server = app.listen(
    PORT,
    () => logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// التعامل مع الأخطاء غير المعالجة (Unhandled Promise Rejections)
// هذا يمنع الخادم من التعطل عند حدوث أخطاء لم يتم التقاطها في الـ Promises
process.on('unhandledRejection', (err, promise) => {
    logger.error(`Error: ${err.message}`);
    // إغلاق الخادم والخروج من العملية بفشل
    server.close(() => process.exit(1));
});