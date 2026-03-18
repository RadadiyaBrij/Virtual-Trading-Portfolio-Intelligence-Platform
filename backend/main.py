from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf

app = FastAPI()

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

def process_stock_data(symbol, data):
    current_price = data.get("currentPrice") or data.get("regularMarketPrice", 0)
    previous_close = data.get("previousClose") or data.get("regularMarketPreviousClose")
    
    # fallback to currentPrice if no prev close, avoiding division by zero
    if not previous_close or previous_close == 0:
        previous_close = current_price

    change = current_price - previous_close if current_price else 0
    change_percent = (change / previous_close) * 100 if previous_close else 0
    
    return {
        "symbol": symbol.upper(),
        "name": data.get("shortName", symbol),
        "price": current_price,
        "change": round(change, 2),
        "changePercent": round(change_percent, 2),
        "volume": format_volume(data.get("volume") or data.get("regularMarketVolume", 0)),
        "isLoss": change < 0
    }

@app.get("/stocks/batch")
def get_stocks_batch(symbols: str = Query(...)):
    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    
    tickers = yf.Tickers(" ".join(sym_list))
    results = []
    
    for sym in sym_list:
        try:
            data = tickers.tickers[sym].info
            if data and ("currentPrice" in data or "regularMarketPrice" in data):
                results.append(process_stock_data(sym, data))
        except Exception as e:
            print(f"Error processing {sym}: {e}")
            continue
            
    return results

@app.get("/stocks/{symbol}")
def get_stock(symbol: str):
    stock = yf.Ticker(symbol)
    data = stock.info
    return process_stock_data(symbol, data)
