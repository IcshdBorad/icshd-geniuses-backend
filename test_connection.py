import asyncio
from core.config import validate_settings
from core.database import connect_redis, connect_postgres, close_connections

async def main():
    print("🔄 جاري بدء فحص طبقة البيانات Mizan Math...")
    
    # 1. التحقق من متغيرات البيئة
    validate_settings()
    
    # 2. اختبار Upstash Redis
    print("\n--- 1. اختبار Upstash Redis ---")
    redis = await connect_redis()
    await redis.set("hyper_test_key", "ICSHD Adaptive Engine Active!", ex=30)
    val = await redis.get("hyper_test_key")
    print(f"📥 القيمة المسترجعة من Redis: '{val}'")
    
    # 3. اختبار Neon PostgreSQL
    print("\n--- 2. اختبار Neon PostgreSQL ---")
    pool = await connect_postgres()
    async with pool.acquire() as conn:
        # أ) إدراج سجل تجريبي
        await conn.execute(
            """
            INSERT INTO learner_attempts (learner_id, is_correct, response_time_ms, difficulty)
            VALUES ($1, $2, $3, $4)
            """,
            "test_genius_001", True, 1250.0, 2.5
        )
        print("✅ تم إدراج تجريبي بنجاح في جدول learner_attempts")
        
        # ب) قراءة السجل
        row = await conn.fetchrow(
            "SELECT * FROM learner_attempts WHERE learner_id = $1 ORDER BY id DESC LIMIT 1",
            "test_genius_001"
        )
        print(f"📊 البيانات المسترجعة من Neon: ID={row['id']}, Learner={row['learner_id']}, Correct={row['is_correct']}, Time={row['response_time_ms']}ms")

    # 4. التنظيف والإغلاق
    await close_connections()
    print("\n🎉 جميع الاختبارات المزدوجة مرت بنجاح تام!")

if __name__ == "__main__":
    asyncio.run(main())