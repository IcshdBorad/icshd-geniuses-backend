exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // هنا يتم التحقق من دور المستخدم (الموجود في req.user.role بعد المصادقة)
        // إذا لم يكن لدى المستخدم الدور المطلوب، يتم إرسال خطأ 403
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next(); // إذا كان الدور مسموحًا به، استمر إلى الدالة التالية
    };
};