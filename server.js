require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();

// الاتصال بقاعدة البيانات
connectDB();

// الإعدادات
const PORT = process.env.PORT || 3000;

// Body Parser
app.use(express.json());

// مسار اختبار
app.get('/', (req, res) => {
  res.send('🚀 ICSHD Geniuses API is running');
});

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
