from typing import List, Optional
import os
import yfinance as yf
from fastapi import FastAPI, Query, HTTPException, Depends, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from db_models import MLPredictionBatch, UserWallet, PortfolioHolding, TransactionLog
import datetime
import requests
import random
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.strip().replace("[", "").replace("]", "").replace("'", "").replace('"', "").replace(" ", "").rstrip("/")

if not SUPABASE_URL or "supabase.co" not in SUPABASE_URL:
    supabase = None
elif not SUPABASE_SERVICE_ROLE_KEY:
    supabase = None
else:
    try:
        key = SUPABASE_SERVICE_ROLE_KEY.strip("[]'\" ")
        supabase: Client = create_client(SUPABASE_URL, key)
    except Exception as e:
        supabase = None

def verify_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase Auth is not configured on the server.")
    token = credentials.credentials
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return user_response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication Failed")

app = FastAPI(title="Antigravity Virtual Trading Platform API")

@app.on_event("startup")
def startup_db_init():
    from database import init_db
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def format_volume(vol):
    if not vol: return "0"
    if vol >= 1_000_000_000:
        return f"{vol/1_000_000_000:.1f}B"
    elif vol >= 1_000_000:
        return f"{vol/1_000_000:.1f}M"
    elif vol >= 1_000:
        return f"{vol/1_000:.1f}K"
    return str(vol)

@app.get("/auth/profile")
def get_user_profile(user=Depends(verify_user), db: Session = Depends(get_db)):
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user.id).first()
    if not wallet:
        wallet = UserWallet(user_id=user.id, balance_inr=1000000.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return {
        "id": user.id,
        "email": user.email,
        "balance": wallet.balance_inr
    }

@app.get("/news")
def get_news(category: str = Query("general")):
    FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
    if not FINNHUB_KEY:
        return {"status": "error", "message": "Finnhub API Key not found"}
    fetch_category = "general" if category.lower() == "india" else category
    url = f"https://finnhub.io/api/v1/news?category={fetch_category}&token={FINNHUB_KEY}"
    try:
        response = requests.get(url)
        data = response.json()
        if category.lower() == "india" and isinstance(data, list):
            india_keywords = ["india", "indian", "bse", "nse", "sensex", "nifty", "rupee", "delhi", "mumbai", "reliance"]
            filtered_data = []
            for article in data:
                text_to_scan = (str(article.get('headline', '')) + " " + str(article.get('summary', ''))).lower()
                if any(keyword in text_to_scan for keyword in india_keywords):
                    filtered_data.append(article)
            return filtered_data
        return data
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/stocks/batch")
def get_stocks_batch(symbols: str = Query(...)):
    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    if not sym_list: return []
    CHUNKS = 20
    results = []
    FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
    for i in range(0, len(sym_list), CHUNKS):
        current_chunk = sym_list[i:i + CHUNKS]
        try:
            data = yf.download(current_chunk, period="5d", progress=False, threads=True)
            for sym in current_chunk:
                try:
                    success = False
                    if not data.empty:
                        if len(current_chunk) > 1 and 'Close' in data and sym in data['Close'].columns:
                            close_series = data['Close'][sym].dropna()
                            vol_series = data['Volume'][sym].dropna()
                            if len(close_series) >= 1:
                                current_price = float(close_series.iloc[-1])
                                prev_close = float(close_series.iloc[-2]) if len(close_series) > 1 else current_price
                                vol = int(vol_series.iloc[-1]) if len(vol_series) else 0
                                spark = [float(x) for x in close_series.tolist()]
                                success = True
                        elif len(current_chunk) == 1 and 'Close' in data and not data['Close'].empty:
                            close_series = data['Close'].dropna()
                            vol_series = data['Volume'].dropna()
                            if not close_series.empty:
                                current_price = float(close_series.iloc[-1])
                                prev_close = float(close_series.iloc[-2]) if len(close_series) > 1 else current_price
                                vol = int(vol_series.iloc[-1]) if len(vol_series) else 0
                                spark = [float(x) for x in close_series.tolist()]
                                success = True
                    if not success and FINNHUB_KEY:
                        try:
                             quote = requests.get(f"https://finnhub.io/api/v1/quote?symbol={sym}&token={FINNHUB_KEY}", timeout=2).json()
                             if quote.get('c', 0) > 0:
                                 current_price = float(quote['c'])
                                 prev_close = float(quote['pc'])
                                 vol = 0
                                 spark = [prev_close, current_price]
                                 success = True
                        except Exception: pass
                    if not success: continue
                    change = current_price - prev_close
                    change_percent = (change / prev_close) * 100 if prev_close else 0.0
                    mcap_str = f"{(current_price * 1000):.1f}B" if sym.endswith('.NS') else "1.0T" 
                    results.append({
                        "symbol": sym.upper(),
                        "name": sym.replace('.NS', '').replace('-', ' '),
                        "price": round(current_price, 2),
                        "previousClose": round(prev_close, 2),
                        "change": round(float(change), 2),
                        "changePercent": round(float(change_percent), 2),
                        "volume": vol,
                        "formattedMarketCap": mcap_str,
                        "isLoss": bool(change < 0),
                        "sparkline": spark
                    })
                except Exception: continue
        except Exception: continue
    return results

@app.get("/stocks/{symbol}")
def get_stock(symbol: str):
    FINNHUB_KEY = os.getenv("FINNHUB_API_KEY")
    try:
        quote_res = requests.get(f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_KEY}").json()
        current_price = quote_res.get("c", 0)
        change = quote_res.get("d", 0)
        change_percent = quote_res.get("dp", 0)
    except Exception:
        current_price, change, change_percent = 0, 0, 0
    try:
        news_res = requests.get(f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={(datetime.datetime.today() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')}&to={datetime.datetime.today().strftime('%Y-%m-%d')}&token={FINNHUB_KEY}").json()
        company_news = news_res[:5] if isinstance(news_res, list) else []
    except Exception:
        company_news = []
    stock = yf.Ticker(symbol)
    data = stock.info
    return {
        "symbol": symbol.upper(),
        "name": data.get("shortName", symbol),
        "price": current_price if current_price else data.get("currentPrice", 0),
        "change": round(change, 2) if change else 0,
        "changePercent": round(change_percent, 2) if change_percent else 0,
        "volume": format_volume(data.get("volume") or data.get("regularMarketVolume", 0)),
        "isLoss": (change < 0) if change else False,
        "description": data.get("longBusinessSummary", "No description available."),
        "sector": data.get("sector", "N/A"),
        "industry": data.get("industry", "N/A"),
        "website": data.get("website", "#"),
        "marketCap": format_volume(data.get("marketCap", 0)),
        "dividendYield": round(data.get("dividendYield", 0) * 100, 2) if data.get("dividendYield") else "N/A",
        "trailingPE": round(data.get("trailingPE", 0), 2) if data.get("trailingPE") else "N/A",
        "forwardPE": round(data.get("forwardPE", 0), 2) if data.get("forwardPE") else "N/A",
        "fiftyTwoWeekLow": data.get("fiftyTwoWeekLow", 0),
        "fiftyTwoWeekHigh": data.get("fiftyTwoWeekHigh", 0),
        "totalRevenue": format_volume(data.get("totalRevenue", 0)),
        "netIncome": format_volume(data.get("netIncomeToCommon", 0)),
        "city": data.get("city", "N/A"),
        "state": data.get("state", "N/A"),
        "country": data.get("country", "N/A"),
        "fullTimeEmployees": data.get("fullTimeEmployees", "N/A"),
        "companyNews": company_news
    }

@app.get("/stocks/{symbol}/analysis")
def get_stock_analysis(symbol: str):
    try:
        from services.scoring_engine import analyze_stock
        return analyze_stock(symbol)
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/stocks/{symbol}/predictions")
def get_stock_predictions(symbol: str):
    try:
        from services.prediction_engine import get_cached_prediction
        return get_cached_prediction(symbol)
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/stocks/{symbol}/chart")
def get_stock_chart(symbol: str, range: str = Query("1M")):
    mapping = {"1D": ("1d", "5m"), "1W": ("5d", "15m"), "1M": ("1mo", "1d"), "1Y": ("1y", "1d")}
    period, interval = mapping.get(range.upper(), ("1mo", "1d"))
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        return [{"time": i.strftime("%b %d") if interval == "1d" else i.strftime("%H:%M %b %d"), "price": round(r['Close'], 2)} for i, r in hist.iterrows()]
    except Exception: return []

@app.get("/portfolio")
def get_portfolio(user=Depends(verify_user), db: Session = Depends(get_db)):
    holdings = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id).all()
    results = []
    for h in holdings:
        try:
            curr = yf.Ticker(h.symbol).fast_info['lastPrice']
        except:
            curr = h.average_buy_price_inr
        results.append({
            "symbol": h.symbol,
            "quantity": h.quantity,
            "avgPrice": h.average_buy_price_inr,
            "currentPrice": curr,
            "value": h.quantity * curr,
            "profit": (curr - h.average_buy_price_inr) * h.quantity
        })
    return results

@app.post("/trade/buy")
def buy_stock(trade: dict, user=Depends(verify_user), db: Session = Depends(get_db)):
    symbol = trade.get("symbol")
    quantity = float(trade.get("quantity"))
    price = float(trade.get("price"))
    rate = 83.0 if ".NS" not in symbol else 1.0
    total_cost = quantity * price * rate
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user.id).first()
    if not wallet or wallet.balance_inr < total_cost:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    wallet.balance_inr -= total_cost
    holding = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id, PortfolioHolding.symbol == symbol).first()
    if holding:
        new_qty = holding.quantity + quantity
        holding.average_buy_price_inr = ((holding.quantity * holding.average_buy_price_inr) + total_cost) / new_qty
        holding.quantity = new_qty
    else:
        holding = PortfolioHolding(user_id=user.id, symbol=symbol, quantity=quantity, average_buy_price_inr=(total_cost/quantity))
        db.add(holding)
    db.add(TransactionLog(user_id=user.id, symbol=symbol, action="BUY", quantity=quantity, price_per_share_local=price, exchange_rate_applied=rate, total_value_inr=total_cost))
    db.commit()
    return {"status": "success", "new_balance": wallet.balance_inr}

@app.post("/trade/sell")
def sell_stock(trade: dict, user=Depends(verify_user), db: Session = Depends(get_db)):
    symbol = trade.get("symbol")
    quantity = float(trade.get("quantity"))
    price = float(trade.get("price"))
    holding = db.query(PortfolioHolding).filter(PortfolioHolding.user_id == user.id, PortfolioHolding.symbol == symbol).first()
    if not holding or holding.quantity < quantity:
        raise HTTPException(status_code=400, detail="Not enough shares to sell")
    rate = 83.0 if ".NS" not in symbol else 1.0
    total_gain = quantity * price * rate
    wallet = db.query(UserWallet).filter(UserWallet.user_id == user.id).first()
    wallet.balance_inr += total_gain
    holding.quantity -= quantity
    if holding.quantity == 0: db.delete(holding)
    db.add(TransactionLog(user_id=user.id, symbol=symbol, action="SELL", quantity=quantity, price_per_share_local=price, exchange_rate_applied=rate, total_value_inr=total_gain))
    db.commit()
    return {"status": "success", "new_balance": wallet.balance_inr}
