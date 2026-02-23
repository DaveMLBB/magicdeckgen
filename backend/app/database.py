from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

# Ottieni il path assoluto della cartella backend
BACKEND_DIR = Path(__file__).parent.parent

# Carica il .env dalla cartella backend
load_dotenv(BACKEND_DIR / ".env")

# Database URL da variabile d'ambiente (default: PostgreSQL locale)
SQLALCHEMY_DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://magicdeckgen:magicdeckgen_dev@localhost:5434/magicdeckgen"
)

# Log per debug
print(f"🔍 Backend directory: {BACKEND_DIR}")
print(f"🔍 Database URL: {SQLALCHEMY_DATABASE_URL.split('@')[0]}@***")
print(f"🔍 Current working directory: {os.getcwd()}")

# Configurazione engine in base al tipo di database
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
