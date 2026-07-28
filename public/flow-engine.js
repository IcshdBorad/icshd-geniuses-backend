/**
 * flow-engine.js
 * نظام الربط والتفاعل اللحظي مع محرك التكيف (AdaptiveEngine) عبر WebSocket
 * مشروع: Mizan Math (ICSHD)
 */
(function () {
    // 1. إعداد الحدود الافتراضية للسرعة ونطاق القيم
    const MIN_SPEED = typeof window.MIN_SPEED !== 'undefined' ? window.MIN_SPEED : 1.0;
    const MAX_SPEED = typeof window.MAX_SPEED !== 'undefined' ? window.MAX_SPEED : 50.0;

    let socketInstance = null;
    let reconnectTimer = null;

    /**
     * تحديث شارة حالة الاتصال في الواجهة الرقمية (DOM UI)
     * @param {'online' | 'offline' | 'connecting'} status 
     */
    function updateUIStatus(status) {
        const statusEl = document.getElementById("engineStatus");
        if (!statusEl) return;

        if (status === 'online') {
            statusEl.className = "engine-status online";
            statusEl.innerHTML = '<i class="fa-solid fa-bolt me-1"></i> متصل بمحرك التكيف 🟢';
        } else if (status === 'offline') {
            statusEl.className = "engine-status text-danger border-danger";
            statusEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation me-1"></i> انقطع الاتصال بالمحرك 🔴';
        } else if (status === 'connecting') {
            statusEl.className = "engine-status";
            statusEl.innerHTML = '<i class="fa-solid fa-network-wired me-1"></i> جاري الاتصال بمحرك التكيف...';
        }
    }

    /**
     * إنشاء أو إعادة فتح اتصال WebSocket مع السيرفر
     * @param {string} websocketUrl - رابط نقطة اتصال FastAPI
     */
    function connectToEngine(websocketUrl) {
        // منع فتح اتصالات مكررة إذا كان الاتصال قائماً أو جاري الاتصال
        if (socketInstance && (socketInstance.readyState === WebSocket.OPEN || socketInstance.readyState === WebSocket.CONNECTING)) {
            return socketInstance;
        }

        console.log('🔄 جاري الاتصال بمحرك التكيف...');
        updateUIStatus('connecting');

        const socket = new WebSocket(websocketUrl);
        socketInstance = socket;

        // عند نجاح فتح الاتصال
        socket.onopen = () => {
            console.log('🧠 Hyper-Mental Engine متصل بنجاح عبر WebSocket');
            if (reconnectTimer) clearTimeout(reconnectTimer);

            // تحديث شارة الواجهة لتصبح متصلة باللون الأخضر
            updateUIStatus('online');

            // إرسال محاكاة/اختبار أول فور نجاح الاتصال
            sendSampleAttempt(socket);
        };

        // عند استقبال بيانات لحظية من سيرفر FastAPI
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("⚡ إشارة تدفق قادمة من المحرك:", data);

                // أ. تحديث سرعة الحركة في الـ Canvas UI
                if (typeof window.targetSpeed !== 'undefined' && data.speed !== undefined) {
                    window.targetSpeed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, data.speed));
                }

                // ب. تحديث متجهات التدفق (Flow Vectors) للشبكة
                if (data.flowVector) {
                    if (typeof window.targetOffsetX !== 'undefined') {
                        window.targetOffsetX = data.flowVector.x * 350;
                    }
                    if (typeof window.targetOffsetY !== 'undefined') {
                        window.targetOffsetY = data.flowVector.y * 250;
                    }
                }

                // ج. تحديث شدة الوهج أو متغيرات CSS الشفافة
                if (data.intensity !== undefined) {
                    document.documentElement.style.setProperty('--flow-intensity', data.intensity);
                }
            } catch (err) {
                console.error("❌ خطأ في معالجة حزمة WebSocket:", err);
            }
        };

        // عند حدوث خطأ في الاتصال
        socket.onerror = (error) => {
            console.error('⚠️ خطأ في اتصال WebSocket:', error);
            updateUIStatus('offline');
        };

        // عند انقطاع الاتصال (إعادة الاتصال التلقائي)
        socket.onclose = () => {
            console.warn('⚠️ تم إغلاق الاتصال بالمحرك، إعادة الاتصال بعد 3 ثوانٍ...');
            updateUIStatus('offline');
            socketInstance = null;
            
            reconnectTimer = setTimeout(() => {
                connectToEngine(websocketUrl);
            }, 3000);
        };

        return socket;
    }

    /**
     * دالة إرسال محاولة أداء تجريبية إلى السيرفر
     * @param {WebSocket} socket 
     */
    function sendSampleAttempt(socket) {
        const activeSocket = socket || socketInstance;
        if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
            const samplePayload = {
                timestamp: Date.now(),
                is_correct: true,
                response_time_ms: 1200,
                expected_time_ms: 3000
            };
            activeSocket.send(JSON.stringify(samplePayload));
        }
    }

    // تصدير الدوال للنطاق العام (Global Scope) للاستخدام خارج الموديول
    window.connectToEngine = connectToEngine;
    window.sendSampleAttempt = sendSampleAttempt;

    // بدء الاتصال تلقائياً بالسيرفر المحلي (FastAPI)
    window.engineSocket = connectToEngine('ws://127.0.0.1:8000/api/v1/adaptive/ws/flow');
})();