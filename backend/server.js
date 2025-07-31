// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// تحميل متغيرات البيئة
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// إعدادات عامة
app.use(cors());
app.use(express.json());

// مسارات تجريبية
app.get('/', (req, res) => {
    res.send('🔵 السيرفر يعمل بنجاح!');
});

// يمكنك ربط مسارات خارجية هنا لاحقًا مثل:
// const mainRoutes = require('./routes/index');
// app.use('/api', mainRoutes);

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على http://localhost:${PORT}`);
});
