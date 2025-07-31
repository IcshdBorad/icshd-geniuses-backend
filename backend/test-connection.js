require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ الاتصال بـ MongoDB تم بنجاح');
    return mongoose.disconnect();
  })
  .catch((err) => {
    console.error('❌ فشل الاتصال:', err.message);
  });
