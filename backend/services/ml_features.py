import pandas as pd
import numpy as np
import pandas_ta as ta

def build_features(df: pd.DataFrame, horizon: str = "30d", is_training: bool = True) -> pd.DataFrame:
    """
    Builds the feature set tailored to the specific prediction horizon.
    Supported horizons: '1d', '7d', '30d'.
    """
    df = df.copy()
    
    # Target Creation
    if is_training:
        if horizon == "1d":
            df['target'] = (df['Close'].shift(-1) / df['Close']) - 1
        elif horizon == "7d":
            df['target'] = (df['Close'].shift(-7) / df['Close']) - 1
        elif horizon == "30d":
            df['target'] = (df['Close'].shift(-30) / df['Close']) - 1
        
        df['target_class'] = (df['target'] > 0).astype(int)

    # Core Price Features (Common)
    df['return_1d'] = df['Close'].pct_change()
    df['log_return'] = np.log(df['Close'] / df['Close'].shift(1))
    
    if horizon == "1d":
        # Fast Features
        df['RSI'] = ta.rsi(df['Close'], length=7)
        df['SMA_5'] = df['Close'].rolling(5).mean()
        df['SMA_10'] = df['Close'].rolling(10).mean()
        df['price_sma5_ratio'] = df['Close'] / df['SMA_5']
        
        df['momentum_1'] = df['Close'].pct_change(1)
        df['momentum_2'] = df['Close'].pct_change(2)
        df['momentum_3'] = df['Close'].pct_change(3)
        
        macd = ta.macd(df['Close'], fast=5, slow=15)
        if macd is not None and not macd.empty:
            df['MACD'] = macd.iloc[:, 0]
        else:
            df['MACD'] = np.nan
            
        df['volatility_5'] = df['Close'].rolling(5).std()
        df['vol_regime'] = df['volatility_5'] / (df['Close'].rolling(20).std() + 1e-9)
        
        # Lags
        for i in range(1, 4):
            df[f'lag_return_{i}'] = df['Close'].pct_change(i)

    elif horizon == "7d":
        # Medium Features
        df['RSI'] = ta.rsi(df['Close'], length=14)
        df['SMA_20'] = df['Close'].rolling(20).mean()
        df['SMA_50'] = df['Close'].rolling(50).mean()
        df['price_sma20_ratio'] = df['Close'] / df['SMA_20']
        
        df['momentum_3'] = df['Close'].pct_change(3)
        df['momentum_5'] = df['Close'].pct_change(5)
        df['momentum_7'] = df['Close'].pct_change(7)
        
        macd = ta.macd(df['Close'], fast=12, slow=26)
        if macd is not None and not macd.empty:
            df['MACD'] = macd.iloc[:, 0]
        else:
            df['MACD'] = np.nan
            
        df['volatility_10'] = df['Close'].rolling(10).std()
        df['vol_regime'] = df['volatility_10'] / (df['Close'].rolling(30).std() + 1e-9)
        
        # Lags
        for i in range(1, 6):
            df[f'lag_return_{i}'] = df['Close'].pct_change(i)

    elif horizon == "30d":
        # Slow Features
        df['SMA_50'] = df['Close'].rolling(50).mean()
        df['SMA_200'] = df['Close'].rolling(200).mean()
        df['price_sma50_ratio'] = df['Close'] / df['SMA_50']
        df['price_sma200_ratio'] = df['Close'] / df['SMA_200']
        df['trend_regime'] = (df['SMA_50'] > df['SMA_200']).astype(int)
        df['trend_strength'] = df['SMA_50'] - df['SMA_200']
        
        df['RSI'] = ta.rsi(df['Close'], length=21)
        
        df['momentum_5'] = df['Close'].pct_change(5)
        df['momentum_10'] = df['Close'].pct_change(10)
        df['momentum_30'] = df['Close'].pct_change(30)
        
        macd = ta.macd(df['Close'], fast=12, slow=26)
        if macd is not None and not macd.empty:
            df['MACD'] = macd.iloc[:, 0]
        else:
            df['MACD'] = np.nan
            
        df['volatility_10'] = df['Close'].rolling(10).std()
        df['volatility_30'] = df['Close'].rolling(30).std()
        df['ATR'] = ta.atr(df['High'], df['Low'], df['Close'], length=14)
        df['vol_regime'] = df['volatility_30'] / (df['volatility_10'] + 1e-9)
        df['risk_adjusted_return'] = df['return_1d'] / (df['volatility_10'] + 1e-9)
        
        df['volume_ma'] = df['Volume'].rolling(10).mean()
        df['volume_spike'] = (df['Volume'] > 1.5 * df['volume_ma']).astype(int)
        
        df['dist_from_high'] = df['Close'] / df['Close'].rolling(30).max()
        
        for i in range(1, 11):
            df[f'lag_return_{i}'] = df['Close'].pct_change(i)

    # Data Cleaning
    df = df.dropna()
    return df
