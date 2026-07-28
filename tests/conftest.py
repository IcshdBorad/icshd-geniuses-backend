import pytest
from httpx import AsyncClient, ASGITransport
from fastapi.testclient import TestClient
from api.main import app
from core.database import Base, engine, get_db, TestingSessionLocal
from core.infrastructure.models import LearnerModel


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def test_learner(db_session):
    learner = LearnerModel(id="test-learner-123", name="Test Learner")
    db_session.add(learner)
    db_session.commit()
    db_session.refresh(learner)
    return learner