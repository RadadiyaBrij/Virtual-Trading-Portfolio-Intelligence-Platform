import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, init_db
from db_models import FundamentalAnalysisCache
from services.scoring_engine import analyze_stock
import datetime
import time

def populate_cache():
    init_db()
    db = SessionLocal()
    symbols = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS", 
        "INFY.NS", "SBIN.NS", "HINDUNILVR.NS", "ITC.NS", "LT.NS", "AAPL", "MSFT", "NVDA"
    ]
    
    print("Starting local cache population...")
    for sym in symbols:
        try:
            print(f"Fetching data for {sym}...")
            result = analyze_stock(sym)
            
            cached = db.query(FundamentalAnalysisCache).filter(FundamentalAnalysisCache.symbol == sym).first()
            if cached:
                cached.analysis_data = result
                cached.last_computed = datetime.datetime.utcnow()
                print(f"Updated cache for {sym}")
            else:
                new_cache = FundamentalAnalysisCache(symbol=sym, analysis_data=result)
                db.add(new_cache)
                print(f"Created new cache for {sym}")
            db.commit()
            time.sleep(2) # be gentle
        except Exception as e:
            print(f"Failed for {sym}: {e}")
            db.rollback()
            
    db.close()
    print("Done!")

if __name__ == "__main__":
    populate_cache()
