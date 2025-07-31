// استيراد المكتبات الأساسية
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors'); // استيراد مكتبة CORS

// **هنا نقوم بتفعيل CORS أولاً قبل أي middleware آخر**
app.use(cors());

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
