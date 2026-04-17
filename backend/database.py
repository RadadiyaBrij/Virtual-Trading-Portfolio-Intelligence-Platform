import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip("[]'\" ")

_engine = None
_SessionLocal = None
_Base = None

def _get_engine():
    global _engine
    if _engine is None:
        if not DATABASE_URL:
            raise ConnectionError("DATABASE_URL environment variable is not set. Check your .env file.")
        from sqlalchemy import create_engine
        try:
            _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        except Exception as e:
            print(f"Critical Database Error: {e}")
            raise e
    return _engine

def _get_base():
    global _Base
    if _Base is None:
        from sqlalchemy.orm import declarative_base
        _Base = declarative_base()
    return _Base


from sqlalchemy.orm import declarative_base
Base = declarative_base()

def SessionLocal():
    """Create a new database session. Raises clear error if DB is not configured."""
    from sqlalchemy.orm import sessionmaker
    engine = _get_engine()
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return Session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Attempt to create all defined tables in db_models.py"""
    try:
        import db_models
        engine = _get_engine()
        Base.metadata.create_all(bind=engine)
        print("PostgreSQL Database tables verified/created via SQLAlchemy.")
    except Exception as e:
        print(f"Database initialization skipped: {e}")

def get_supabase_client():
    from supabase import create_client, Client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise ValueError("Missing Supabase Service Key or URL")
    
    url = url.strip("[]'\" ")
    key = key.strip("[]'\" ")
    
    return create_client(url, key)
