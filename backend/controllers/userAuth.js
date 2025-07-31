const logger = require('../utils/logger');
const User = require('../models/User'); // <== هام: تأكد من استيراد نموذج المستخدم
const bcrypt = require('bcryptjs'); // لتشفير كلمات المرور
const jwt = require('jsonwebtoken'); // لإنشاء رموز JWT

// @desc      تسجيل مستخدم جديد
// @route     POST /api/v1/auth/register
// @access    عام (Public)
exports.registerUser = async (req, res, next) => {
    try {
        // 1. استخراج البيانات من req.body
        const { username, email, password, firstName, lastName, role, ageGroup, studentCode, trainerCode } = req.body;

        // 2. التحقق من صحة البيانات الأساسية
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ success: false, message: 'Please enter all required fields: username, email, password, first name, last name' });
        }

        // 3. التحقق مما إذا كان المستخدم موجودًا بالفعل بالبريد الإلكتروني أو اسم المستخدم
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email or username already exists' });
        }

        // 4. إنشاء المستخدم في قاعدة البيانات
        const newUser = await User.create({
            username,
            email,
            password, // سيتم تشفيرها بواسطة middleware في نموذج المستخدم
            profile: {
                firstName,
                lastName
                // يمكنك إضافة حقول أخرى هنا مثل dateOfBirth, phone, avatar, bio
            },
            role: role || 'student', // الدور الافتراضي هو 'student' إذا لم يتم تحديده
            ageGroup: ageGroup, // يطبق فقط على الطلاب
            studentCode: role === 'student' ? (studentCode || new User().generateStudentCode()) : undefined,
            trainerCode: role === 'trainer' ? (trainerCode || new User().generateTrainerCode()) : undefined,
            //trainerId: // إذا كنت تربط الطالب بالمدرب عند التسجيل
        });

        // 5. إنشاء رمز JWT
        const token = newUser.getSignedJwtToken();

        logger.info(`User registered successfully: ${newUser.email} with role: ${newUser.role}`);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role,
                firstName: newUser.profile.firstName,
                lastName: newUser.profile.lastName
            }
        });
    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        // تفاصيل الخطأ في وضع التطوير
        res.status(500).json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : 'Server Error' });
    }
};

// @desc      تسجيل دخول المستخدم
// @route     POST /api/v1/auth/login
// @access    عام (Public)
exports.loginUser = async (req, res, next) => {
    try {
        // 1. استخراج البيانات من req.body
        const { email, password } = req.body;

        // 2. التحقق من صحة البيانات
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please enter both email and password' });
        }

        // 3. البحث عن المستخدم في قاعدة البيانات (باستخدام select('+password') لجلب حقل كلمة المرور)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials (user not found)' });
        }

        // 4. مقارنة كلمة المرور
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials (password mismatch)' });
        }

        // 5. تحديث آخر تسجيل دخول
        user.lastLogin = new Date();
        user.loginAttempts = 0; // إعادة تعيين محاولات تسجيل الدخول
        await user.save();

        // 6. إنشاء رمز JWT
        const token = user.getSignedJwtToken();

        logger.info(`User logged in successfully: ${user.email}`);
        res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                firstName: user.profile.firstName,
                lastName: user.profile.lastName
            }
        });
    } catch (error) {
        logger.error(`Error logging in user: ${error.message}`);
        res.status(500).json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : 'Server Error' });
    }
};

// @desc      الحصول على بيانات المستخدم الحالي
// @route     GET /api/v1/auth/me
// @access    خاص (Private) - يتطلب وجود middleware للمصادقة (req.user)
exports.getMe = async (req, res, next) => {
    // افترض هنا أن middleware المصادقة قد قام بتعيين `req.user`
    // إذا لم يكن لديك middleware للمصادقة، فهذه الدالة لن تعمل بشكل صحيح
    // لأغراض التجربة، يمكن إرجاع مستخدم وهمي أو رسالة
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized, no user token provided or invalid token.' });
        }
        const user = await User.findById(req.user.id).select('-password'); // لا ترجع كلمة المرور
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        logger.error(`Error getting user data: ${error.message}`);
        res.status(500).json({ success: false, error: process.env.NODE_ENV === 'development' ? error.message : 'Server Error' });
    }
};