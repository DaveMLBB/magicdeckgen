from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path

# Ottieni il path assoluto della cartella backend
BACKEND_DIR = Path(__file__).parent.parent
DB_PATH = BACKEND_DIR / "data" / "magic.db"

# SQLite con persistenza su file (come H2 file mode)
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Log per debug
print(f"🔍 Backend directory: {BACKEND_DIR}")
print(f"🔍 Database path: {DB_PATH}")
print(f"🔍 Current working directory: {os.getcwd()}")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
