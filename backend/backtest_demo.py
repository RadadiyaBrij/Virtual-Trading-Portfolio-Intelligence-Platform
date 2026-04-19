import json
from services.backtest_engine import run_backtest

def main():
    print("Running Multi-Horizon System for AAPL...")
    result = run_backtest("AAPL")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
