# core/application/bootstrap.py

from dataclasses import dataclass
from typing import Optional
from core.services.adaptive_engine import AdaptiveEngine
from core.domain.repositories.adaptive_profile_repository import IAdaptiveProfileRepository
from core.application.use_cases.submit_answer_use_case import SubmitAnswerUseCase

@dataclass
class Application:
    submit_answer_use_case: SubmitAnswerUseCase
    adaptive_engine: AdaptiveEngine
    adaptive_profile_repo: IAdaptiveProfileRepository

def bootstrap(
    learners_repo,
    sessions_repo,
    questions_repo,
    adaptive_profile_repo: IAdaptiveProfileRepository,
    adaptive_engine: Optional[AdaptiveEngine] = None,
) -> Application:
    
    # 1. تهيئة المحرك التكيفي بالإعدادات الافتراضية إذا لم يُمرَّر
    engine = adaptive_engine or AdaptiveEngine(target_accuracy=0.80)

    # 2. بناء حالات الاستخدام (Use Cases) بحقن التبعيات المناسبة
    submit_answer_use_case = SubmitAnswerUseCase(
        adaptive_engine=engine,
        profile_repo=adaptive_profile_repo,
        question_repo=questions_repo,
        session_repo=sessions_repo
    )

    return Application(
        submit_answer_use_case=submit_answer_use_case,
        adaptive_engine=engine,
        adaptive_profile_repo=adaptive_profile_repo
    )