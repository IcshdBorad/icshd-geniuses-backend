// استيراد المكتبات الأساسية
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors'); // استيراد مكتبة CORS

// **الحل النهائي لمشكلة CORS**
// هذا يضمن أن يتم تفعيل CORS بشكل صارم في بداية كل طلب.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // السماح لأي مصدر [cite: user_input].
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// الاتصال بقاعدة البيانات
connectDB();

// الإعدادات
const PORT = process.env.PORT || 3000;

// Body Parser - يسمح للخادم بفهم البيانات المرسلة في طلبات JSON
app.use(express.json());

// مسار اختبار بسيط
app.get('/', (req, res) => {
  res.send('🚀 ICSHD Geniuses API is running');
});

// مسارات API (هنا يتم استخدام المسارات التي تحددها)
// app.use('/api/v1/auth', require('./routes/api/auth'));
// app.use('/api/v1/users', require('./routes/api/users'));
// app.use('/api/v1/posts', require('./routes/api/posts'));


// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
