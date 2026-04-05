import numpy as np
import pandas as pd
import yfinance as yf
import xgboost as xgb
import os
import joblib
import ta

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

# ─── Training Blueprint Configuration ───
# "model_1d.pkl (The Tomorrow Model): Past 3 to 5 years. Heavily relies on Technical Indicators."
# "model_7d.pkl (The Next Week Model): Past 5 years. Mix of Technicals and some sector-level data."
# "model_30d.pkl (The Next Month Model): Past 10 years. Heavily relies on Fundamental Scoring Engine + 50 SMA."

def fetch_data(symbols, period):
    print(f"Fetching {period} dataset for {len(symbols)} symbols...")
    dataframes = []
    for sym in symbols:
        try:
            df = yf.download(sym, period=period, progress=False)
            if df.empty: continue
            
            # Drop multi-index if present
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.droplevel(1)
            
            # Common Features
            close = df['Close']
            df['RSI'] = ta.momentum.RSIIndicator(close, window=14).rsi()
            df['MACD'] = ta.trend.MACD(close).macd_diff()
            df['SMA_5'] = ta.trend.SMAIndicator(close, window=5).sma_indicator()
            df['SMA_50'] = ta.trend.SMAIndicator(close, window=50).sma_indicator()
            df['Volume_Spike'] = df['Volume'] / df['Volume'].rolling(20).mean()
            
            # Pseudo fundamental mock historical proxy since yfinance doesn't store 10yr historical fundamental scores
            # In production, this would join with the company's historical quarterly score database.
            df['Mock_Fund_Score'] = np.random.normal(50, 15, size=len(df)) # Proxied
            
            # Targets (Y Variables) - Classification (Will it go up?)
            df['target_1d'] = (df['Close'].shift(-1) > df['Close']).astype(int)
            df['target_7d'] = (df['Close'].shift(-5) > df['Close']).astype(int) # 5 trading days = 1 week
            df['target_30d'] = (df['Close'].shift(-21) > df['Close']).astype(int) # 21 trading days = 1 month
            
            dataframes.append(df.dropna())
        except Exception as e:
            print(f"Failed {sym}: {e}")
            
    return pd.concat(dataframes, ignore_index=True) if dataframes else pd.DataFrame()


def train_1d_model(symbols):
    print("\nTraining 1D Model (The Tomorrow Model) - Pipeline Started")
    df = fetch_data(symbols, period="4y") # 4 years
    if df.empty: return
    
    # Exclude fundamentals, rely completely on short-term momentum
    X = df[['RSI', 'MACD', 'Volume_Spike', 'SMA_5']]
    y = df['target_1d']
    
    model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.05, eval_metric="logloss")
    model.fit(X, y)
    
    path = os.path.join(MODELS_DIR, "model_1d.pkl")
    joblib.dump(model, path)
    print(f"✅ model_1d.pkl saved to {path} (Features: RSI, MACD, Volume, 5 SMA)")


def train_7d_model(symbols):
    print("\nTraining 7D Model (The Next Week Model) - Pipeline Started")
    df = fetch_data(symbols, period="5y") # 5 years
    if df.empty: return
    
    # Mix of Technicals
    X = df[['RSI', 'MACD', 'SMA_5', 'SMA_50']]
    y = df['target_7d']
    
    model = xgb.XGBClassifier(n_estimators=150, max_depth=4, learning_rate=0.03, eval_metric="logloss")
    model.fit(X, y)
    
    path = os.path.join(MODELS_DIR, "model_7d.pkl")
    joblib.dump(model, path)
    print(f"✅ model_7d.pkl saved to {path} (Features: Mix of Fast/Slow Indicators)")


def train_30d_model(symbols):
    print("\nTraining 30D Model (The Next Month Model) - Pipeline Started")
    df = fetch_data(symbols, period="10y") # 10 years
    if df.empty: return
    
    # Relies on Fundamental Proxy & Long Term baseline (50 SMA)
    X = df[['Mock_Fund_Score', 'SMA_50']]
    y = df['target_30d']
    
    model = xgb.XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.01, eval_metric="logloss")
    model.fit(X, y)
    
    path = os.path.join(MODELS_DIR, "model_30d.pkl")
    joblib.dump(model, path)
    print(f"✅ model_30d.pkl saved to {path} (Features: Fundamental Score, 50 SMA)")


def run_monthly_training():
    """
    Blueprint: "Model Retraining (Once a Month): You do not retrain every day. 
    Once a month... you run a heavy background script that downloads the latest month... 
    and re-fits the XGBoost models."
    """
    print("Initiating Master Monthly Model Retraining Script...")
    
    # Using a high-liquidity sample basket for the master base models
    training_symbols = ["AAPL", "RELIANCE.NS", "MSFT", "INFY.NS", "TSLA", "HDFCBANK.NS"]
    
    train_1d_model(training_symbols)
    train_7d_model(training_symbols)
    train_30d_model(training_symbols)

if __name__ == "__main__":
    run_monthly_training()
