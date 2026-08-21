import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Need to insert backend path to import scoring engine
sys.path.insert(0, os.path.abspath('.'))
from services.scoring_engine import analyze_stock
import datetime
import time

def populate_cache():
    load_dotenv()
    url = os.getenv('SUPABASE_URL')
    key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    if not url or not key:
        print("Missing Supabase credentials in .env")
        return
        
    supabase = create_client(url, key)
    
    symbols = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "AAPL", "MSFT"
    ]
    
    print("Starting local cache population via REST API...")
    for sym in symbols:
        try:
            print(f"Fetching local data for {sym}...")
            result = analyze_stock(sym)
            
            if result.get("totalScore", 0) > 0:
                # Check if exists
                existing = supabase.table('fundamental_analysis_cache').select('symbol').eq('symbol', sym).execute()
                
                data = {
                    "symbol": sym,
                    "analysis_data": result,
                    "last_computed": datetime.datetime.utcnow().isoformat()
                }
                
                if existing.data and len(existing.data) > 0:
                    supabase.table('fundamental_analysis_cache').update(data).eq('symbol', sym).execute()
                    print(f"Updated cache for {sym}")
                else:
                    supabase.table('fundamental_analysis_cache').insert(data).execute()
                    print(f"Created new cache for {sym}")
            else:
                print(f"Skipping {sym} because score is 0")
                
            time.sleep(1.5)
        except Exception as e:
            print(f"Failed for {sym}: {e}")
            
    print("Done!")

if __name__ == "__main__":
    populate_cache()
