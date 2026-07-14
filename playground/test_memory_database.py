from core.persistence.memory_database import MemoryDatabase

db = MemoryDatabase()

db.skills["S1"] = "Addition"

print(db.skills)