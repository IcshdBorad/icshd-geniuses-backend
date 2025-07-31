// backend/routes/auth.js
const express = require('express');
const router = express.Router();
// استيراد وظائف التحكم (controllers) التي تحتوي على منطق العمل
// تم تصحيح المسار ليتطابق تمامًا مع حالة الأحرف على GitHub: Auth.Controller.js
const { registerUser, loginUser, getMe } = require('../controllers/userAuth.js');
// @desc    تسجيل مستخدم جديد
// @route   POST /api/v1/auth/register
// @access  عام (Public)
router.post('/register', registerUser);

// @desc    تسجيل دخول المستخدم
// @route   POST /api/v1/auth/login
// @access  عام (Public)
router.post('/login', loginUser);

// @desc    الحصول على بيانات المستخدم الحالي (يتطلب مصادقة)
// @route   GET /api/v1/auth/me
// @access  خاص (Private) - ستحتاج إلى middleware للمصادقة هنا لاحقًا
// router.get('/me', protect, getMe); // مثال: إذا كان لديك middleware حماية

module.exports = router;
