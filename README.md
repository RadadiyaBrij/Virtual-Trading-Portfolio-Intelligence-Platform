# TradeMind — Virtual Trading & Portfolio Intelligence Platform

> A full-stack quantitative trading simulator with a proprietary AI scoring engine, multi-horizon XGBoost ML predictions, and a database-cached architecture for zero-cost cloud deployment.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Schema](#4-database-schema)
5. [Data Pipeline](#5-data-pipeline)
6. [Fundamental Scoring Engine](#6-fundamental-scoring-engine)
7. [Machine Learning — Quantitative AI System](#7-machine-learning--quantitative-ai-system)
8. [API Endpoints](#8-api-endpoints)
9. [Frontend Pages](#9-frontend-pages)
10. [Deployment Guide](#10-deployment-guide)
11. [Running Scripts Locally](#11-running-scripts-locally)

---

## 1. Project Overview

TradeMind is a high-performance virtual trading and quantitative intelligence platform. Users get a simulated portfolio starting with **₹10,00,000 (1 Million INR)** and can:

- Browse a real-time market screener of **160+ stocks** across India (Nifty 50), Global (S&P 500 top picks), and US markets.
- Execute simulated BUY/SELL trades with real market prices, tracked P&L, and a full transaction history.
- View proprietary **Fundamental Intelligence Scores** calculated by a custom rule-based scoring engine.
- Run **AI-powered multi-horizon price predictions** (1-Day, 7-Day, 30-Day) powered by XGBoost ML models.
- Read aggregated financial news via a dedicated News page.

---

## 2. Technology Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React (Vite), TailwindCSS | Fast SPA, modern component model |
| **Backend** | Python, FastAPI | High-performance async REST API |
| **Database** | PostgreSQL (Supabase) | Free managed DB with persistent JSON storage |
| **ORM** | SQLAlchemy | Database models, migrations, queries |
| **Market Data** | yfinance (Yahoo Finance) | Only free source for Indian NSE/BSE data |
| **Price Quotes** | Finnhub API | US stock real-time quotes |
| **ML Engine** | XGBoost, scikit-learn | Fast gradient-boosted tree classification |
| **Technical Indicators** | pandas-ta | RSI, MACD, SMA, EMA calculations |
| **Frontend Hosting** | Vercel | Free global CDN |
| **Backend Hosting** | Render | Free tier Python server |

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                          │
│              React SPA (Hosted on Vercel)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS REST API calls
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              FastAPI Backend (Hosted on Render)              │
│                                                             │
│  ┌─────────────────┐   ┌──────────────────────────────┐    │
│  │  main.py        │   │  services/                   │    │
│  │  REST Endpoints │──▶│  scoring_engine.py           │    │
│  │  CORS Middleware│   │  backtest_engine.py           │    │
│  │  Auth via UID   │   │  ml_features.py              │    │
│  └────────┬────────┘   └──────────────────────────────┘    │
│           │                                                 │
│           │ SQLAlchemy ORM queries                         │
│           ▼                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Supabase PostgreSQL (Free Managed DB)               │   │
│  │  Tables: fundamental_cache, chart_cache,            │   │
│  │          ml_backtest_cache, portfolio_holdings,     │   │
│  │          user_wallets, transaction_logs             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         ▲
          ┌──────────────┘
          │  (Local Machine only — runs on YOUR laptop)
          │
┌─────────────────────────────────────────────────────────────┐
│              DATA INGESTION SCRIPTS (Local)                  │
│                                                             │
│  scripts/update_all_data.py  ──▶  yfinance (Yahoo Finance)  │
│  batch_run_ml.py             ──▶  XGBoost model training    │
│                                                             │
│  NOTE: Scripts MUST run locally because cloud servers       │
│  are blocked by Yahoo Finance (anti-scraping protection).   │
│  Scripts push results to Supabase DB, which the Render      │
│  backend then serves to the frontend.                       │
└─────────────────────────────────────────────────────────────┘
```

### Why this architecture?
Yahoo Finance (the only free source for Indian NSE/BSE stock data) actively blocks all known cloud server IP ranges (AWS, Render, Railway, etc.). To circumvent this, all heavy data fetching happens on a **local machine** (your laptop/desktop at home with a residential IP), and results are pushed into a hosted PostgreSQL database. The Render backend server never calls Yahoo Finance — it only reads from the database, which is extremely fast and 100% reliable.

---

## 4. Database Schema

```
┌──────────────────────────────┐     ┌──────────────────────────────┐
│  fundamental_cache           │     │  chart_cache                 │
│──────────────────────────────│     │──────────────────────────────│
│  symbol (PK)                 │     │  symbol (PK)                 │
│  data (JSON)                 │     │  sparkline (JSON)            │
│    ├─ name, sector, industry │     │  chart_1w (JSON)             │
│    ├─ roe, roce, pat_margin  │     │  chart_1m (JSON)             │
│    ├─ pe, pb, forward_pe     │     │  chart_1y (JSON)             │
│    ├─ debt_equity, eps       │     │  current_price (Float)       │
│    ├─ sales_growth           │     │  previous_close (Float)      │
│    ├─ current_price          │     │  volume (Integer)            │
│    └─ market_cap, etc.       │     │  market_cap_str (String)     │
│  last_computed (DateTime)    │     │  last_computed (DateTime)    │
└──────────────────────────────┘     └──────────────────────────────┘

┌──────────────────────────────┐     ┌──────────────────────────────┐
│  ml_backtest_cache           │     │  user_wallets                │
│──────────────────────────────│     │──────────────────────────────│
│  symbol (PK)                 │     │  user_id (PK)                │
│  backtest_data (JSON)        │     │  balance_inr (Float)         │
│    ├─ finalSignal            │     │    default: ₹10,00,000       │
│    ├─ multiHorizon (1d/7d/30d│     │  updated_at (DateTime)       │
│    ├─ winRate, maxDrawdown   │     └──────────────────────────────┘
│    ├─ strategySumReturn      │
│    └─ actionHolding/Not      │     ┌──────────────────────────────┐
│  last_computed (DateTime)    │     │  portfolio_holdings          │
└──────────────────────────────┘     │──────────────────────────────│
                                     │  id (PK, autoincrement)      │
┌──────────────────────────────┐     │  user_id                     │
│  transaction_logs            │     │  symbol                      │
│──────────────────────────────│     │  quantity                    │
│  id (PK, autoincrement)      │     │  average_buy_price_inr       │
│  user_id                     │     │  last_updated (DateTime)     │
│  symbol                      │     └──────────────────────────────┘
│  action (BUY / SELL)         │
│  quantity                    │
│  price_per_share_local       │
│  exchange_rate_applied       │
│  total_value_inr             │
│  reference_buy_price_inr     │
│  profit_loss_inr             │
│  timestamp (DateTime)        │
└──────────────────────────────┘
```

---

## 5. Data Pipeline

### `scripts/update_all_data.py`

This script is run locally and pushes all price + fundamental data into Supabase.

```
For each of 109 symbols:
│
├── 1. Call yf.Ticker(symbol).info
│       └── Extracts: ROE, ROCE, PAT Margin, PE, PB, Debt/Equity,
│                     EPS, Market Cap, Revenue, Sales Growth, etc.
│           Saves to → fundamental_cache table
│
├── 2. Call yf.download(symbol, period="1y")
│       └── Gets daily OHLCV (Open/High/Low/Close/Volume) data
│           Extracts:
│             ├── sparkline  = last 30 days of closing prices
│             ├── chart_1w   = last 7 days of daily prices
│             ├── chart_1m   = last 30 days of daily prices
│             └── chart_1y   = last 365 days of daily prices
│           Saves to → chart_cache table
│
└── 3. Sleeps 2 seconds between each stock
        (Rate-limiting to avoid Yahoo Finance blocking)
```

**Run frequency:** At least once per week (prices become stale otherwise).

---

## 6. Fundamental Scoring Engine

**File:** `backend/services/scoring_engine.py`

The scoring engine calculates a proprietary **0–100 Fundamental Score** for every stock. It is a rule-based expert system, not ML.

### Scoring Groups & Weights

```
Total Score (0–100)
│
├── Profitability (30 pts)
│     ├── ROE — Return on Equity       (10 pts)
│     ├── ROCE — Return on Capital     (8 pts)
│     └── PAT Margin — Net Profit %    (7 pts)
│
├── Growth (25 pts)
│     ├── Sales Growth YoY             (10 pts)
│     └── Profit Growth YoY           (10 pts)
│
├── Financial Health (25 pts)
│     ├── Debt-to-Equity Ratio         (10 pts)
│     └── Current Ratio                (10 pts)
│
└── Valuation (20 pts)
      ├── Price-to-Earnings (PE)       (10 pts)
      └── Price-to-Book (PB)           (8 pts)
```

### Sector-Aware Scoring
The engine detects the sector (Banking, IT Services, Manufacturing, Energy/PSU, Consumer/FMCG) and applies **different thresholds** per sector. For example:
- **Banks** have Debt/Equity ignored entirely (banks are supposed to have high debt — that's their business model).
- **IT companies** have Price-to-Book ignored (they are asset-light, so PB is always inflated and meaningless).
- **FMCG companies** tolerate very high PE ratios (premium brands always trade expensive).

### Rating Conversion

| Score | Rating |
|---|---|
| 75–100 | Strong Buy |
| 60–74 | Buy |
| 45–59 | Moderate / Watchlist |
| 30–44 | Caution |
| 0–29 | Avoid |

---

## 7. Machine Learning — Quantitative AI System

**Files:** `backend/services/backtest_engine.py`, `backend/services/ml_features.py`, `backend/batch_run_ml.py`

### Step-by-Step ML Pipeline

```
For each stock symbol:

STEP 1: Data Download
│   yf.download(symbol, start="2016-01-01", end="today")
│   → Downloads full 10-year daily OHLCV history
│   → Also downloads SPY (S&P 500 index) as a market benchmark
│
STEP 2: Feature Engineering (ml_features.py)
│   Three separate feature sets are built — one per horizon:
│
│   1-Day Model (4-year lookback)
│   ├── RSI (7-period)        — short-term momentum
│   ├── SMA 5 & 10           — very short moving averages
│   ├── MACD (5,15)          — fast momentum crossover
│   ├── Volatility (5-day)   — current risk
│   └── Lagged returns (1-3 days)
│
│   7-Day Model (7-year lookback)
│   ├── RSI (14-period)       — medium-term momentum
│   ├── SMA 20 & 50          — standard moving averages
│   ├── MACD (12,26)         — standard settings
│   ├── Volatility (10-day)
│   └── Lagged returns (1-5 days)
│
│   30-Day Model (10-year lookback)
│   ├── RSI (14-period)
│   ├── SMA 50 & 200         — long-term trend (Golden Cross)
│   ├── Trend Regime         — SMA50 > SMA200 (1) or not (0)
│   ├── MACD (12,26)
│   ├── ATR (volatility)
│   └── Lagged returns (1-10 days)
│
STEP 3: Target Label Creation
│   For training, the label (Y) for each day is:
│   ├── 1-Day: "Did the stock go UP next day?"       → 1 or 0
│   ├── 7-Day: "Did the stock go UP after 7 days?"   → 1 or 0
│   └── 30-Day: "Did the stock go UP after 30 days?" → 1 or 0
│
STEP 4: Train/Test Split
│   80% of historical data → Training set
│   20% most recent data  → Test set (for accuracy measurement)
│
STEP 5: XGBoost Model Training
│   Model: XGBClassifier
│   ├── n_estimators = 300 (trees)
│   ├── max_depth: 4 (1d), 5 (7d), 6 (30d)
│   ├── learning_rate = 0.05
│   └── Both the target stock AND SPY benchmark are fed in
│       (multi-stock training gives the model market context)
│
STEP 6: Backtesting the Strategy
│   Simulate trading on test set (last 20% of data):
│   ├── Entry rule: prob_30d > 55% AND prob_7d > 55%
│   ├── Holding period: 30 days
│   ├── Transaction cost: 0.1% each way
│   └── Records: Win Rate, Max Drawdown, Total Return,
│                Buy-and-Hold Return (benchmark comparison)
│
STEP 7: Generate Current Signal
│   Take the LAST row of data (today's indicators) and run
│   it through all 3 trained models to get:
│   ├── prob_1d  → 1-Day probability of going UP
│   ├── prob_7d  → 7-Day probability
│   └── prob_30d → 30-Day probability
│
│   Final signal decision tree:
│   ├── prob_30d > 52% AND prob_7d > 52% AND prob_1d > 52% → BUY
│   ├── prob_30d > 52% AND prob_7d > 52% AND prob_1d ≤ 52% → BUY DIP
│   ├── prob_30d > 52% AND prob_7d ≤ 52%                  → WAIT
│   ├── prob_30d < 48%                                     → SELL
│   └── otherwise                                          → NEUTRAL
│
STEP 8: Save to Database
    Saves full result JSON to ml_backtest_cache table
    (includes signals, expected returns, win rate, drawdown, etc.)
```

### Why Full-Retraining Every Day?
The model is **fully retrained from scratch** each day (not incrementally updated). This avoids "Catastrophic Forgetting" — a known problem in ML where a model trained on just 1 new day forgets patterns from 5 years ago, leading to severely degraded accuracy. Since XGBoost trains on 10 years of stock data in under 5 seconds per stock, full daily retraining is fast and always optimal.

---

## 8. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stocks/batch?symbols=X,Y,Z` | Get screener data for multiple stocks |
| `GET` | `/stocks/{symbol}` | Get full detail for a single stock |
| `GET` | `/stocks/{symbol}/analysis` | Run fundamental scoring engine |
| `GET` | `/stocks/{symbol}/backtest` | Get cached ML predictions |
| `GET` | `/stocks/{symbol}/chart?period=1w` | Get chart data (1w, 1m, 1y) |
| `GET` | `/portfolio/{user_id}` | Get user's holdings and P&L |
| `POST` | `/portfolio/buy` | Execute a simulated BUY order |
| `POST` | `/portfolio/sell` | Execute a simulated SELL order |
| `GET` | `/portfolio/{user_id}/transactions` | Get full transaction history |
| `GET` | `/news` | Get aggregated financial news |
| `GET` | `/health` | Health check endpoint |

---

## 9. Frontend Pages

| Page | File | Description |
|---|---|---|
| Login / Signup | `Login.jsx`, `Signup.jsx` | Auth pages (UID-based, no passwords stored) |
| Dashboard | `Dashboard.jsx` | Portfolio summary, P&L, quick market overview |
| Market Screener | `stocks.jsx` | Browse 160+ stocks, filter by market, live prices |
| Stock Details | `StockDetails.jsx` | Price chart, trading widget, company info, news |
| Strategic Analysis | `StockAnalysis.jsx` | Fundamental score + AI signal dashboard |
| Portfolio | `Portfolio.jsx` | Holdings, realized/unrealized P&L, trade history |
| News | `News.jsx` | Aggregated financial news via Finnhub |
| Profile | `Profile.jsx` | User settings, balance display |

---

## 10. Deployment Guide

### Backend (Render)
1. Push code to GitHub.
2. Create a new **Web Service** on Render, connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port 10000`.
6. Add **Environment Variables**:
   - `DATABASE_URL` = your Supabase Session Pooler connection string (port 6543)
   - `FINNHUB_API_KEY` = your Finnhub API key

### Frontend (Vercel)
1. Connect your GitHub repo to Vercel.
2. Set **Root Directory** to `frontend`.
3. Add **Environment Variable**:
   - `VITE_API_URL` = your Render backend URL

---

## 11. Running Scripts Locally

> These scripts MUST be run on your local machine (not on the server) because Yahoo Finance blocks cloud server IPs.

### Update Live Prices & Charts (~5 min)
```powershell
cd C:\Virtual-Trading-Portfolio-Intelligence-Platform\backend
.\venv\Scripts\python scripts\update_all_data.py
```

### Retrain AI Models (~10-15 min)
```powershell
cd C:\Virtual-Trading-Portfolio-Intelligence-Platform\backend
.\venv\Scripts\python batch_run_ml.py
```

### Recommended Schedule
- **Daily** (after 3:30 PM IST market close): Run `update_all_data.py` for fresh prices.
- **Daily** (after prices are updated): Run `batch_run_ml.py` to retrain AI on today's new data.
- The ML script automatically **skips stocks already trained today** (within 24 hours), so it is safe to run multiple times.
