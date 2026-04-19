import time
import datetime
from database import SessionLocal, init_db
from db_models import StockScoreCache, MLBacktestCache
from services.backtest_engine import run_backtest

def run_ml_batch():
    init_db()  
    db = SessionLocal()
    print("Starting Nightly ML Batch Run...")
    
    nifty50 = "RELIANCE.NS,TCS.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,INFY.NS,SBIN.NS,HINDUNILVR.NS,ITC.NS,LT.NS,BAJFINANCE.NS,HCLTECH.NS,MARUTI.NS,SUNPHARMA.NS,TMPV.NS,KOTAKBANK.NS,M&M.NS,ONGC.NS,NTPC.NS,TITAN.NS,ADANIPORTS.NS,ASIANPAINT.NS,ULTRACEMCO.NS,POWERGRID.NS,BAJAJFINSV.NS,WIPRO.NS,COALINDIA.NS,INDUSINDBK.NS,TATASTEEL.NS,GRASIM.NS,BAJAJ-AUTO.NS,TECHM.NS,HINDALCO.NS,ADANIENT.NS,CIPLA.NS,DRREDDY.NS,EICHERMOT.NS,DIVISLAB.NS,APOLLOHOSP.NS,TATACONSUM.NS,HEROMOTOCO.NS,BRITANNIA.NS,UPL.NS,SBILIFE.NS,HDFCLIFE.NS,BPCL.NS,SHREECEM.NS,HDFCAMC.NS,PIDILITIND.NS,VEDL.NS"
    globalsyms = "AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,BRK-B,LLY,V,TSM,JPM,UNH,WMT,MA,JNJ,PG,HD,ORCL,AVGO,CVX,MRK,ABBV,COST,PEP,CRM,BAC,KO,TMO,MCD,CSCO,ACN,NFLX,AMD,ABT,LIN,QCOM,INTC,DIS,IBM,CAT,GE,MMM,HON,BA,SPY,QQQ,DIA,NKE,AXP,GS,PFE,T,VZ,WFC,C,XOM,CVX,MDT,PM"
    
    all_syms_str = nifty50 + "," + globalsyms
    symbols = [s.strip() for s in all_syms_str.split(",") if s.strip()]
    
    symbols = list(dict.fromkeys(symbols))
    
    if not symbols:
        print("No stocks found in the database. Ensure fundamental scores are populated first.")
        db.close()
        return
        
    print(f"Found {len(symbols)} stocks. Processing ML pipelines...")
    
    success_count = 0
    error_count = 0
    
    for i, symbol in enumerate(symbols):
        print(f"[{i+1}/{len(symbols)}] Training ML pipeline for {symbol}...")
        try:
        #    Skip if already computed.
            cached = db.query(MLBacktestCache).filter(MLBacktestCache.symbol == symbol).first()
            if cached:
                time_diff = datetime.datetime.utcnow() - cached.last_computed
                if time_diff.total_seconds() < 86400: 
                    print(f"  - Skipped: {symbol} (Already cached today)")
                    continue
                    
            result = run_backtest(symbol)
            if result and result.get("status") == "success":
                if cached:
                    cached.backtest_data = result
                    cached.last_computed = datetime.datetime.utcnow()
                else:
                    new_cache = MLBacktestCache(symbol=symbol, backtest_data=result)
                    db.add(new_cache)
                
                db.commit()
                success_count += 1
                print(f"  ✓ Success: {symbol} ML logic cached.")
            else:
                error_count += 1
                msg = result.get('message') if result else "Unknown Error"
                print(f"  x Error for {symbol}: {msg}")
        except Exception as e:
            error_count += 1
            print(f"  x Exception for {symbol}: {e}")
            db.rollback() 
            
        # Small delay to prevent API rate limiting from yfinance
        time.sleep(1)
        
    print("-" * 50)
    print(f"ML Batch Run Complete!")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")
    db.close()

if __name__ == "__main__":
    run_ml_batch()
