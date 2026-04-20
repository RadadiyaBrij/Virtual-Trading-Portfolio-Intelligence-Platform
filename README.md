# TradeMind Quant - Virtual Trading & Portfolio Intelligence Platform

TradeMind Quant is a high-performance virtual trading and quantitative intelligence platform. It provides users with real-time market data, technical analysis, automated backtesting capabilities, and a comprehensive simulated portfolio management system with a modern, glassmorphism-inspired UI.

## Features

- **Market Screener**: High-speed discovery for India 100, Nifty 50, and Global 60 stocks.
- **Virtual Portfolio Management**: Simulated trading (Buy/Sell) with realistic transaction logging and accurate all-time profit/loss calculations.
- **Quantitative Analytics**: Fundamental scoring engine, historical price charting, and backtest projections.
- **Global News Intelligence**: Real-time market sentiment and global financial news.
- **Premium User Interface**: Cinematic UI featuring Framer Motion animations, interactive dynamic cards, and a sophisticated "Stack Up Tower" dashboard layout.

## Technology Stack

### Frontend
- **React.js (Vite)**
- **Tailwind CSS** (for styling and glassmorphism effects)
- **Framer Motion** (for smooth, high-fidelity UI animations)
- **Chart.js / Recharts** (for financial data visualization)

### Backend
- **Python / FastAPI**
- **Supabase (PostgreSQL)**
- **SQLAlchemy** (ORM)
- **yfinance** (for real-time market data aggregation)

## Setup & Installation

### Prerequisites
- Node.js & npm
- Python 3.9+
- Supabase account & project

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your `.env` file with your Supabase credentials:
   ```
   DATABASE_URL="your-supabase-db-url"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_KEY="your-supabase-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-key"
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Architecture Notes
- The platform uses a nightly batch processing pipeline (`batch_run_ml.py`) to pre-compute and cache stock fundamental scores and backtesting data into the database for extremely fast frontend load times.