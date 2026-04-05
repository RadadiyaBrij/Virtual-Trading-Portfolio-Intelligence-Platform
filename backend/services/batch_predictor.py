import time
import datetime
import pytz
import os
import joblib
import pandas as pd
import numpy as np
import yfinance as yf
from scipy.interpolate import interp1d

import ta
from .scoring_engine import analyze_stock
from database import SessionLocal
from db_models import MLPredictionBatch

# Indian Standard Time (IST) configured for the Cron Job check
IST = pytz.timezone('Asia/Kolkata')

# You will eventually replace these with actual loaded XGBoost models (.pkl)
# e.g., model_1d = joblib.load('model_1d.pkl')
# For this batch script skeleton, we use mock prediction functions pointing to your XGBoost structure.
def mock_predict_1d(features): return 1.01  # Predicts +1% tomorrow
def mock_predict_7d(features): return 1.03  # Predicts +3% next week
def mock_predict_30d(features): return 1.08 # Predicts +8% next month

def wait_for_market_close():
    """
    Blueprint Rules: "Do not run your nightly prediction batch at midnight IST... 
    Schedule your cron job to run at 3:00 AM IST."
    """
    now = datetime.datetime.now(IST)
    if now.hour != 3:
        print(f"Current IST Time: {now.strftime('%H:%M:%S')}. Batch only runs at 03:00 AM.")
        # In a real crontab, it just triggers at 3 AM. 
        # Here we just log it for verification.

def process_stock(symbol: str, db):
    """
    Step A: Fetch Data -> Step B: Calculate Features -> Step C: Merge Fundamentals -> Predict
    """
    try:
        # Step A: 60-day Lookback
        df = yf.download(symbol, period="60d", progress=False)
        if df.empty:
            return
            
        close_series = df['Close']
        if isinstance(close_series, pd.DataFrame):
            close_series = close_series.iloc[:, 0]
            
        current_price = float(close_series.iloc[-1])
        
        # Step B: Technical Features via pandas-ta equivalents
        rsi_14 = ta.momentum.RSIIndicator(close_series, window=14).rsi().iloc[-1]
        macd = ta.trend.MACD(close_series).macd().iloc[-1]
        
        features = {
            "rsi": rsi_14,
            "macd": macd,
            "current_price": current_price
        }

        # Step C: Merge with Hybrid Scoring Engine
        fund_data = analyze_stock(symbol)
        fund_score = fund_data.get("totalScore", 50)
        fund_rating = fund_data.get("rating", "Neutral")
        
        # Combine Fundamental + Technical for XGBoost models...
        # In production: model_30d.predict(pd.DataFrame([features_dict]))
        
        # Execute Models (returning price multipliers)
        target_day_1 = current_price * mock_predict_1d(features)
        target_day_7 = current_price * mock_predict_7d(features)
        target_day_30 = current_price * (1.0 + (fund_score - 40) / 400.0) # Dummy 30d based on score

        # Upsert to PostgreSQL
        record = db.query(MLPredictionBatch).filter_by(symbol=symbol).first()
        if not record:
            record = MLPredictionBatch(symbol=symbol)
            db.add(record)
            
        record.fundamental_score = fund_score
        record.rating = fund_rating
        record.price_day_0 = current_price
        record.price_day_1 = target_day_1
        record.price_day_7 = target_day_7
        record.price_day_30 = target_day_30
        
        # We can pass mock probabilities or actual predict_proba[1] from XGBoost
        record.prob_1d = 0.55 
        record.prob_7d = 0.60
        record.prob_30d = fund_score / 100.0 
        
        db.commit()
        print(f"✅ {symbol} Processed & Saved. Target_30D: ₹{target_day_30:.2f}")

    except Exception as e:
        print(f"❌ Error processing {symbol}: {e}")
        db.rollback()

def run_nightly_batch():
    wait_for_market_close()
    
    # 110 Stocks Array Representation (Top 50 Indian Nifty + Top 60 Global)
    indian_symbols = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'BHARTIARTL.NS', 'INFY.NS', 'SBIN.NS', 'HINDUNILVR.NS', 'ITC.NS', 'LT.NS', 
        'BAJFINANCE.NS', 'HCLTECH.NS', 'MARUTI.NS', 'SUNPHARMA.NS', 'TMPV.NS', 'KOTAKBANK.NS', 'M&M.NS', 'ONGC.NS', 'NTPC.NS', 'TITAN.NS', 
        'ADANIPORTS.NS', 'ASIANPAINT.NS', 'ULTRACEMCO.NS', 'POWERGRID.NS', 'BAJAJFINSV.NS', 'WIPRO.NS', 'COALINDIA.NS', 'INDUSINDBK.NS', 
        'TATASTEEL.NS', 'GRASIM.NS', 'BAJAJ-AUTO.NS', 'TECHM.NS', 'HINDALCO.NS', 'ADANIENT.NS', 'CIPLA.NS', 'DRREDDY.NS', 'EICHERMOT.NS', 
        'DIVISLAB.NS', 'APOLLOHOSP.NS', 'TATACONSUM.NS', 'HEROMOTOCO.NS', 'BRITANNIA.NS', 'UPL.NS', 'SBILIFE.NS', 'HDFCLIFE.NS', 'BPCL.NS',
        'SHREECEM.NS', 'HDFCAMC.NS', 'PIDILITIND.NS', 'VEDL.NS',
        'HAL.NS', 'INDIGO.NS', 'TRENT.NS', 'SIEMENS.NS', 'CHOLAFIN.NS', 'BEL.NS', 'IOC.NS', 'DLF.NS', 'BANKBARODA.NS', 'ZOMATO.NS', 
        'JIOFIN.NS', 'LTIM.NS', 'IRFC.NS', 'PNB.NS', 'ABB.NS', 'TVSMOTOR.NS', 'ATGL.NS', 'HAVELLS.NS', 'AMBUJACEM.NS', 'GAIL.NS', 
        'BOSCHLTD.NS', 'ICICIPRULI.NS', 'SHRIRAMFIN.NS', 'PIIND.NS', 'CGPOWER.NS', 'POLYCAB.NS', 'MACROTECH.NS', 'TORNTPHARM.NS', 'INDHOTEL.NS', 
        'CUMMINSIND.NS', 'IDBI.NS', 'MUTHOOTFIN.NS', 'RECLTD.NS', 'PFC.NS', 'TATACOMM.NS', 'COLPAL.NS', 'DABUR.NS', 'JSWENERGY.NS', 'UBL.NS', 
        'GICRE.NS', 'SUZLON.NS', 'LUPIN.NS', 'PGHH.NS', 'MCDOWELL-N.NS', 'MAXHEALTH.NS', 'NHPC.NS', 'YESBANK.NS', 'AUBANK.NS', 'BANDHANBNK.NS', 'PAYTM.NS'
    ]
    global_symbols = [
        'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK-B', 'LLY', 'V', 'TSM', 'JPM', 'UNH', 'WMT', 'MA', 
        'JNJ', 'PG', 'HD', 'ORCL', 'AVGO', 'CVX', 'MRK', 'ABBV', 'COST', 'PEP', 'CRM', 'BAC', 'KO', 'TMO', 'MCD', 'CSCO', 
        'ACN', 'NFLX', 'AMD', 'ABT', 'LIN', 'QCOM', 'INTC', 'DIS', 'IBM', 'CAT', 'GE', 'MMM', 'HON', 'BA', 'SPY', 'QQQ', 'DIA',
        'NKE', 'AXP', 'GS', 'PFE', 'T', 'VZ', 'WFC', 'C', 'XOM', 'CVX', 'MDT', 'PM'
    ]
    symbols = indian_symbols + global_symbols
    
    db = SessionLocal()
    print(f"Initiating Nightly XGBoost Batch Pipeline for {len(symbols)} companies...")
    
    for symbol in symbols:
        process_stock(symbol, db)
        
        # Blueprint Fix 1: The API Rate Limit Trap (time.sleep)
        time.sleep(2) 
        
    db.close()
    print("Batch process completed. Database updated successfully.")

if __name__ == "__main__":
    run_nightly_batch()
