import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip("[]'\" ")

def cleanup():
    if not DATABASE_URL:
        print("DATABASE_URL not found in .env")
        return

    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as connection:
        print("Dropping old table 'ml_predictions' if it exists...")
        connection.execute(text("DROP TABLE IF EXISTS ml_predictions;"))
        
        print("Clearing new table 'stock_scores' if it exists...")
        connection.execute(text("TRUNCATE TABLE stock_scores;"))
        
        connection.commit()
        print("Database cleanup successful.")

if __name__ == "__main__":
    cleanup()
