import os
import sys
import time
import math
import yfinance as yf
import datetime

# Add the parent directory to sys.path so we can import from backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from db_models import FundamentalCache, ChartCache

nifty50Symbols = 'RELIANCE.NS,TCS.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,INFY.NS,SBIN.NS,HINDUNILVR.NS,ITC.NS,LT.NS,BAJFINANCE.NS,HCLTECH.NS,MARUTI.NS,SUNPHARMA.NS,TMPV.NS,KOTAKBANK.NS,M&M.NS,ONGC.NS,NTPC.NS,TITAN.NS,ADANIPORTS.NS,ASIANPAINT.NS,ULTRACEMCO.NS,POWERGRID.NS,BAJAJFINSV.NS,WIPRO.NS,COALINDIA.NS,INDUSINDBK.NS,TATASTEEL.NS,GRASIM.NS,BAJAJ-AUTO.NS,TECHM.NS,HINDALCO.NS,ADANIENT.NS,CIPLA.NS,DRREDDY.NS,EICHERMOT.NS,DIVISLAB.NS,APOLLOHOSP.NS,TATACONSUM.NS,HEROMOTOCO.NS,BRITANNIA.NS,UPL.NS,SBILIFE.NS,HDFCLIFE.NS,BPCL.NS,SHREECEM.NS,HDFCAMC.NS,PIDILITIND.NS,VEDL.NS'
globalSymbols = 'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,BRK-B,LLY,V,TSM,JPM,UNH,WMT,MA,JNJ,PG,HD,ORCL,AVGO,CVX,MRK,ABBV,COST,PEP,CRM,BAC,KO,TMO,MCD,CSCO,ACN,NFLX,AMD,ABT,LIN,QCOM,INTC,DIS,IBM,CAT,GE,MMM,HON,BA,SPY,QQQ,DIA,NKE,AXP,GS,PFE,T,VZ,WFC,C,XOM,CVX,MDT,PM'

all_symbols = list(set((nifty50Symbols + "," + globalSymbols).split(",")))

def g(info, k, d=None):
    v = info.get(k, d)
    return d if v is None or (isinstance(v, float) and math.isnan(v)) else v

def extract_fundamentals(symbol: str, info: dict):
    is_usd = not (symbol.endswith('.NS') or symbol.endswith('.BO'))
    ex = 83.0 if is_usd else 1.0

    ni = g(info, "netIncomeToCommon")
    rev = g(info, "totalRevenue")
    ast = g(info, "totalAssets")
    debt = g(info, "totalDebt")
    eq = g(info, "totalStockholderEquity")
    price = g(info, "currentPrice")
    mcap = g(info, "marketCap")
    cash = g(info, "totalCash")
    ev = g(info, "enterpriseValue")
    bv = g(info, "bookValue")
    shares = g(info, "sharesOutstanding")
    ebit = g(info, "ebit")
    cur_liab = g(info, "totalCurrentLiabilities")
    
    rev_growth = g(info, "revenueGrowth")
    earn_growth = g(info, "earningsGrowth")

    roe = g(info, "returnOnEquity")
    if roe is None and ni:
        if eq and eq > 0: roe = ni / eq
        elif bv and shares and (bv * shares) > 0: roe = ni / (bv * shares)
    
    pat_margin = g(info, "profitMargins")
    if pat_margin is None and ni and rev and rev > 0:
        pat_margin = ni / rev

    roce = None
    if ebit and ast:
        cap_employed = ast - (cur_liab or 0)
        if cap_employed > 0:
            roce = ebit / cap_employed

    roe_val = round(roe * 100, 2) if roe is not None else None
    roce_val = round(roce * 100, 2) if roce is not None else None
    pat_val = round(pat_margin * 100, 2) if pat_margin is not None else None

    effective_equity = eq if (eq and eq > 0) else (bv * shares if (bv and shares and bv*shares > 0) else None)
    de_ratio = round(debt / effective_equity, 2) if debt is not None and effective_equity else None

    # We store the raw data in a dict exactly matching what extract_fundamentals_from_yfinance returned
    return {
        "roe": roe_val,
        "roce": roce_val,
        "pat_margin": pat_val,
        "sales_growth": round(rev_growth * 100, 2) if rev_growth is not None else None,
        "profit_growth": round(earn_growth * 100, 2) if earn_growth is not None else None,
        "debt_equity": de_ratio,
        "total_debt": debt * ex if debt else None,
        "cash": cash * ex if cash else None,
        "enterprise_value": ev * ex if ev else None,
        "market_cap": mcap * ex if mcap else None,
        "pe": g(info, "trailingPE"),
        "forward_pe": g(info, "forwardPE"),
        "pb": g(info, "priceToBook"),
        "dividend_yield": round(g(info, "dividendYield", 0) * 100, 2) if g(info, "dividendYield") is not None else None,
        "sector": g(info, "sector"),
        "industry": g(info, "industry"),
        "symbol": symbol,
        "name": g(info, "shortName", symbol) if isinstance(g(info, "shortName", symbol), str) else symbol,
        "eps": g(info, "trailingEps"),
        "book_value": bv * ex if bv else None,
        "current_price": price * ex if price else None,
        "description": g(info, "longBusinessSummary", "No description available."),
        "website": g(info, "website", "#"),
        "fiftyTwoWeekLow": round(g(info, "fiftyTwoWeekLow", 0) * ex, 2) if g(info, "fiftyTwoWeekLow") else 0,
        "fiftyTwoWeekHigh": round(g(info, "fiftyTwoWeekHigh", 0) * ex, 2) if g(info, "fiftyTwoWeekHigh") else 0,
        "city": g(info, "city", "N/A"),
        "state": g(info, "state", "N/A"),
        "country": g(info, "country", "N/A"),
        "fullTimeEmployees": g(info, "fullTimeEmployees", "N/A"),
        "totalRevenue": rev * ex if rev else 0,
        "netIncome": ni * ex if ni else 0,
        "volume": g(info, "volume") or g(info, "regularMarketVolume", 0)
    }

def fetch_chart(ticker, period, interval, ex):
    try:
        hist = ticker.history(period=period, interval=interval)
        return [{"time": i.strftime("%b %d") if interval == "1d" else i.strftime("%H:%M %b %d"), "price": round(r['Close'] * ex, 2)} for i, r in hist.iterrows()]
    except Exception:
        return []

def main():
    db = SessionLocal()
    print(f"Starting update for {len(all_symbols)} symbols...")
    
    for idx, sym in enumerate(all_symbols):
        print(f"[{idx+1}/{len(all_symbols)}] Fetching data for {sym}...")
        try:
            ticker = yf.Ticker(sym)
            info = ticker.info
            if not isinstance(info, dict):
                info = {}
                
            fund_data = extract_fundamentals(sym, info)
            
            # Store fundamentals
            f_cache = db.query(FundamentalCache).filter(FundamentalCache.symbol == sym).first()
            if not f_cache:
                f_cache = FundamentalCache(symbol=sym)
                db.add(f_cache)
            f_cache.data = fund_data
            f_cache.last_computed = datetime.datetime.utcnow()
            
            # Chart Data
            is_usd = not (sym.endswith('.NS') or sym.endswith('.BO'))
            ex = 83.0 if is_usd else 1.0
            
            chart_1w = fetch_chart(ticker, "5d", "15m", ex)
            chart_1m = fetch_chart(ticker, "1mo", "1d", ex)
            chart_1y = fetch_chart(ticker, "1y", "1d", ex)
            
            # Sparkline and Screener Data
            try:
                hist_5d = ticker.history(period="5d")
                if not hist_5d.empty:
                    close_series = hist_5d['Close'].dropna()
                    vol_series = hist_5d['Volume'].dropna()
                    
                    if len(close_series) >= 1:
                        current_price = float(close_series.iloc[-1])
                        prev_close = float(close_series.iloc[-2]) if len(close_series) > 1 else current_price
                        vol = int(vol_series.iloc[-1]) if len(vol_series) else 0
                        sparkline = [float(x * ex) for x in close_series.tolist()]
                    else:
                        current_price, prev_close, vol, sparkline = 0, 0, 0, []
                else:
                    current_price, prev_close, vol, sparkline = 0, 0, 0, []
            except Exception:
                current_price, prev_close, vol, sparkline = 0, 0, 0, []
                
            mcap = fund_data.get("market_cap", 0)
            if mcap >= 10000000: mcap_str = f"{mcap / 10000000:.2f} Cr"
            elif mcap >= 100000: mcap_str = f"{mcap / 100000:.2f} L"
            else: mcap_str = f"{mcap:,.0f}"

            c_cache = db.query(ChartCache).filter(ChartCache.symbol == sym).first()
            if not c_cache:
                c_cache = ChartCache(symbol=sym)
                db.add(c_cache)
                
            c_cache.sparkline = sparkline
            c_cache.chart_1w = chart_1w
            c_cache.chart_1m = chart_1m
            c_cache.chart_1y = chart_1y
            c_cache.current_price = float(current_price * ex)
            c_cache.previous_close = float(prev_close * ex)
            c_cache.volume = vol
            c_cache.market_cap_str = mcap_str
            c_cache.last_computed = datetime.datetime.utcnow()
            
            db.commit()
            
            # User feedback: Wait time to avoid limits
            time.sleep(2.0)
            
        except Exception as e:
            print(f"Error updating {sym}: {e}")
            db.rollback()
            time.sleep(5.0)

    db.close()
    print("Done!")

if __name__ == "__main__":
    main()
