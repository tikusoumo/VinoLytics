import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# TODO: Don't hardcode this in production. Move to a .env file loaded via pydantic-settings
DATABASE_URL = "postgresql+psycopg2://postgres:postgrespassword@localhost:5432/inventory_db"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    # Pragmatic DB session generator. 
    # Spawns a session for a request and tears it down afterwards.
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
