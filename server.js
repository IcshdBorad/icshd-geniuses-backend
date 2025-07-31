// استيراد المكتبات الأساسية
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors'); // استيراد مكتبة CORS

// الاتصال بقاعدة البيانات
connectDB();

// الإعدادات
// يتم استخدام المنفذ الموجود في متغيرات البيئة (environment variables) أو 3000 كقيمة افتراضية
const PORT = process.env.PORT || 3000;

// Body Parser - يسمح للخادم بفهم البيانات المرسلة في طلبات JSON
app.use(express.json());

// تفعيل CORS (Cross-Origin Resource Sharing)
// هذا السطر يسمح للطلبات القادمة من أي نطاق (domain) بالاتصال بهذا الخادم.
// هذا سيحل مشكلة "CORS policy" التي كنت تواجهها.
// في بيئة الإنتاج، يُفضل تحديد نطاقات معينة لأسباب أمنية.
app.use(cors());

// مسار اختبار بسيط
// عند زيارة المسار الجذر، سيعيد الخادم هذه الرسالة.
app.get('/', (req, res) => {
  res.send('🚀 ICSHD Geniuses API is running');
});

// مسارات API (هنا يتم استخدام المسارات التي تحددها)
// يتم إلغاء تعليق هذه الأسطر عند إضافة مسارات جديدة
// app.use('/api/v1/auth', require('./routes/api/auth'));
// app.use('/api/v1/users', require('./routes/api/users'));
// app.use('/api/v1/posts', require('./routes/api/posts'));


// تشغيل السيرفر
// يبدأ الخادم بالاستماع للطلبات على المنفذ المحدد.
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
