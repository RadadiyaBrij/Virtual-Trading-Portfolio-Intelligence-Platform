from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, JSON
from database import Base
import datetime

class UserWallet(Base):
    __tablename__ = "user_wallets"

    user_id = Column(String, primary_key=True, index=True)
    balance_inr = Column(Float, default=1000000.0) # Start with 1,000,000 INR
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    symbol = Column(String, index=True)
    quantity = Column(Float, default=0.0)
    average_buy_price_inr = Column(Float, nullable=False)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    symbol = Column(String)
    action = Column(String) # 'BUY' or 'SELL'
    quantity = Column(Float)
    price_per_share_local = Column(Float) # The price in foreign/local currency
    exchange_rate_applied = Column(Float) # E.g.  for USD->INR
    total_value_inr = Column(Float) # The definitive deduction from the wallet
    profit_loss_inr = Column(Float, nullable=True) # Realized profit/loss for this transaction
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class StockScoreCache(Base):
    __tablename__ = "stock_scores"
    
    # Store the daily batch run projections for extremely fast fetching
    symbol = Column(String, primary_key=True, index=True)
    
    fundamental_score = Column(Float)
    rating = Column(String)
    
    current_price = Column(Float)
    last_computed = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class MLBacktestCache(Base):
    __tablename__ = "ml_backtest_cache"
    
    symbol = Column(String, primary_key=True, index=True)
    backtest_data = Column(JSON, nullable=False)
    last_computed = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
