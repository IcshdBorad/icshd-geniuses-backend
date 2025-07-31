const pino = require('pino'); // مكتبة Pino للـ logging
const pinoPretty = require('pino-pretty'); // لطباعة السجلات بشكل جميل في التطوير

// تكوين الـ logger
const logger = pino({
    // مستوى الـ logging الافتراضي (مثلاً 'info', 'debug', 'error')
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    // خيارات لـ pino-pretty في وضع التطوير
    transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true, // تلوين السجلات
            translateTime: 'SYS:HH:MM:ss Z', // تنسيق الوقت
            ignore: 'pid,hostname', // تجاهل بعض الحقول غير الضرورية
        }
    } : undefined, // لا تستخدم pino-pretty في وضع الإنتاج
});

module.exports = logger;