# core/presentation/api/routers/admin_settings.py
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/admin", tags=["Admin Settings"])

class SystemSettingsDTO(BaseModel):
    global_timer_seconds: int = 60  # التحكم الصارم بمدة الاختبار

# حفظ الإعدادات في ذاكرة النظام/قاعدة البيانات
SYSTEM_CONFIG = {"timer_seconds": 60}

@router.put("/settings/timer")
def update_global_timer(settings: SystemSettingsDTO):
    """تحديث المؤقت الزمني مركزيًا من قبل الإدارة فقط."""
    SYSTEM_CONFIG["timer_seconds"] = settings.global_timer_seconds
    return {"message": "تم تحديث المؤقت بنجاح", "timer_seconds": SYSTEM_CONFIG["timer_seconds"]}

@router.get("/settings/timer")
def get_global_timer():
    return {"timer_seconds": SYSTEM_CONFIG["timer_seconds"]}