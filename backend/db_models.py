from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from database import Base
import datetime

# ──────────────────────────────────────────────────────────
# 1. CORE WALLET/PORTFOLIO ARCHITECTURE
# ──────────────────────────────────────────────────────────
class UserWallet(Base):
    __tablename__ = "user_wallets"

    # User ID links to Supabase Auth system (auth.users)
    user_id = Column(String, primary_key=True, index=True)
    # The default currency is INR for primary virtual balance.
    balance_inr = Column(Float, default=1000000.0) # Start with 1,000,000 INR
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    symbol = Column(String, index=True) # e.g. "RELIANCE.NS" or "AAPL"
    quantity = Column(Float, default=0.0)
    average_buy_price_inr = Column(Float, nullable=False) # Important: Always normalize to INR in DB for stats
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, index=True)
    symbol = Column(String)
    action = Column(String) # 'BUY' or 'SELL'
    quantity = Column(Float)
    price_per_share_local = Column(Float) # The price in foreign/local currency
    exchange_rate_applied = Column(Float) # E.g. 83.5 for USD->INR
    total_value_inr = Column(Float) # The definitive deduction from the wallet
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

# ──────────────────────────────────────────────────────────
# 2. FUNDAMENTAL SCORING ARCHITECTURE
# ──────────────────────────────────────────────────────────
class StockScoreCache(Base):
    __tablename__ = "stock_scores"
    
    # Store the daily batch run projections for extremely fast fetching
    symbol = Column(String, primary_key=True, index=True)
    
    # Fundamental Base
    fundamental_score = Column(Float)
    rating = Column(String)
    
    # Current Price at time of computation
    current_price = Column(Float)
    
    # Cron Update Timestamp
    last_computed = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
