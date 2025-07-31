// استيراد المكتبات الأساسية
require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const app = express();
const cors = require('cors'); // استيراد مكتبة CORS

// الاتصال بقاعدة البيانات
connectDB();

// الإعدادات
const PORT = process.env.PORT || 3000;

// Body Parser - يسمح للخادم بفهم البيانات المرسلة في طلبات JSON
app.use(express.json());

// تفعيل CORS (Cross-Origin Resource Sharing)
// هذا يسمح للواجهة الأمامية (موقع ووردبريس) بالاتصال بالخادم الخلفي [cite: image_bf74c1.png].
// الخيار 'app.use(cors());' يسمح بالطلبات من أي نطاق (لأغراض الاختبار).
// في الإنتاج، يُفضل تحديد نطاقات معينة:
// app.use(cors({ origin: 'https://yourwordpressdomain.com' }));
app.use(cors());

// مسار اختبار بسيط
app.get('/', (req, res) => {
  res.send('🚀 ICSHD Geniuses API is running');
});

// مسارات API (هنا يتم استخدام المسارات التي تحددها)
// app.use('/api/v1/auth', require('./routes/api/auth')); // مثال لمسار المصادقة

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
