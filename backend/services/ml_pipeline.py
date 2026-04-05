import yfinance as yf
import pandas as pd
import numpy as np
from ta.momentum import RSIIndicator
from ta.trend import MACD, SMAIndicator
from ta.volatility import BollingerBands

def fetch_historical_data(symbol: str, period="5y"):
    """
    Fetch historical daily OHLCV data.
    """
    df = yf.download(symbol, period=period)
    
    # yfinance output format can sometimes involve MultiIndex columns, flatten if necessary
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.droplevel(1)
        
    df.dropna(inplace=True)
    return df

def generate_targets(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 1: Define Your Targets (The "Y" Variables)
    Creates boolean/binary targets for classification models.
    """
    # Create future shifted columns
    # Tomorrow's close
    df['Close_1d_future'] = df['Close'].shift(-1)
    # Close 5 days from now (1 week)
    df['Close_1w_future'] = df['Close'].shift(-5)
    # Close 21 days from now (1 month)
    df['Close_1m_future'] = df['Close'].shift(-21)
    # Close 126 days from now (6 months)
    df['Close_6m_future'] = df['Close'].shift(-126)

    # Generate classifications
    # target_1d: Did the stock close higher tomorrow than today? (1 = Yes, 0 = No)
    df['target_1d'] = (df['Close_1d_future'] > df['Close']).astype(int)
    
    # target_1w: Did the stock go up > 1% over the next 5 trading days?
    df['target_1w'] = ((df['Close_1w_future'] - df['Close']) / df['Close'] > 0.01).astype(int)
    
    # target_1m: Did the stock go up > 3% over the next 21 trading days?
    df['target_1m'] = ((df['Close_1m_future'] - df['Close']) / df['Close'] > 0.03).astype(int)
    
    # target_6m: Did the stock go up > 8% over the next 126 trading days?
    df['target_6m'] = ((df['Close_6m_future'] - df['Close']) / df['Close'] > 0.08).astype(int)
    
    # Drop future price columns since they are just intermediate data
    df.drop(columns=['Close_1d_future', 'Close_1w_future', 'Close_1m_future', 'Close_6m_future'], inplace=True)
    
    return df

def generate_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Step 2: Engineer Time-Specific Features (The "X" Variables)
    Generate Technical Indicators for short-term models.
    """
    close = df['Close']
    
    # Price Action & Returns
    df['daily_return'] = close.pct_change()
    df['log_return'] = np.log(close / close.shift(1))
    df['vol_change'] = df['Volume'].pct_change()

    # Technical Indicators: Moving Averages
    df['sma_9'] = SMAIndicator(close=close, window=9).sma_indicator()
    df['sma_21'] = SMAIndicator(close=close, window=21).sma_indicator()
    df['sma_50'] = SMAIndicator(close=close, window=50).sma_indicator()
    df['sma_200'] = SMAIndicator(close=close, window=200).sma_indicator()
    
    # Moving Average Crossovers (1 = bullish, -1 = bearish)
    df['cross_9_21'] = np.where(df['sma_9'] > df['sma_21'], 1, -1)
    
    # RSI (Relative Strength Index)
    df['rsi_14'] = RSIIndicator(close=close, window=14).rsi()
    
    # MACD
    macd = MACD(close=close)
    df['macd_line'] = macd.macd()
    df['macd_signal'] = macd.macd_signal()
    df['macd_diff'] = macd.macd_diff()
    
    # Bollinger Bands
    bb = BollingerBands(close=close, window=20, window_dev=2)
    df['bb_high'] = bb.bollinger_hband()
    df['bb_low'] = bb.bollinger_lband()
    df['bb_width'] = (df['bb_high'] - df['bb_low']) / close # normalized width
    df['bb_pct_b'] = bb.bollinger_pband() # where the price is between the bands
    
    return df

def prepare_dataset(symbol="AAPL", period="5y"):
    """
    Fetches data, generates features and targets, and drops rows with NaNs.
    """
    print(f"Fetching {period} historical data for {symbol}...")
    df = fetch_historical_data(symbol, period)
    
    print("Generating Multi-Horizon targets...")
    df = generate_targets(df)
    
    print("Engineering Technical Features...")
    df = generate_features(df)
    
    # Drop rows that have NaN values (mostly because of shift and MA windows)
    # For prediction we will drop NaNs in target columns later, but for features we drop immediately
    # Note: latest data will have NaN for target_6m etc. We must not drop them if we want to predict today!
    
    return df

if __name__ == "__main__":
    df = prepare_dataset("AAPL", period="2y")
    print(df.tail(10))
    print(f"Dataset shape: {df.shape}")
