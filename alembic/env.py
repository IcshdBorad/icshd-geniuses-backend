import asyncio
import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# 1. تحميل متغيرات البيئة من ملف .env
load_dotenv()

# 2. جلب كائن الإعدادات لـ Alembic
config = context.config

# 3. تحديث رابط قاعدة البيانات ديناميكيًا من البيئة
database_url = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL")
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

# 4. إعداد سجلات التتبع (Logging)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# 5. ربط النماذج الكائنية (Models) لدعم التوليد التلقائي (autogenerate)
from core.database import Base  # noqa
import core.infrastructure.models  # noqa

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """تشغيل الهجرات في وضع عدم الاتصال (Offline)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """تشغيل الهجرات اللا تزامنية (Async)."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """تشغيل الهجرات في وضع الاتصال المباشر (Online)."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()