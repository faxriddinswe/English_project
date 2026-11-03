from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

engine = create_engine(get_settings().database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)


def get_db():
    # One transaction per request: no success response is sent before the dependency commits.
    with SessionLocal() as db:
        with db.begin():
            yield db
