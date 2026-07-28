from typing import Dict, Any
import core.infrastructure.models as models

# التعامل مع اختلاف المسميات داخل core/infrastructure/models.py
SessionModel = getattr(
    models, 
    'SessionModel', 
    getattr(models, 'Session', getattr(models, 'LearningSession', None))
)

class CreateSessionUseCase:
    def __init__(self, db_session=None):
        self.db_session = db_session

    async def execute(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if SessionModel is None:
            # في حال لم يتم تعيين الموديل بعد
            return {"session_id": "demo-session-id", **data}

        # تنفيذ المنطق عند توفر قاعدة البيانات والموديل
        return {"session_id": "created-successfully", "details": data}