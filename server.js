require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// الاتصال بقاعدة البيانات
connectDB();

// الإعدادات
const PORT = process.env.PORT || 3000;

// إعداد CORS للسماح من أي مصدر (يمكنك استبداله بـ 'https://icshd.net' لأمان أكثر)
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// تفعيل CORS
app.use(cors(corsOptions));

// معالجة جميع طلبات OPTIONS
app.options('*', cors(corsOptions));

// Body Parser
app.use(express.json());

// مسار اختبار
app.get('/', (req, res) => {
  res.send('🚀 ICSHD Geniuses API is running');
});

// مثال لمسار التسجيل
app.post('/api/v1/auth/register', (req, res) => {
  res.json({ message: '✅ تم التسجيل بنجاح', data: req.body });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
