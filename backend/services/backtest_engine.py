import yfinance as yf
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score
import warnings

warnings.filterwarnings('ignore')
from .ml_features import build_features

def run_backtest(symbol: str) -> dict:
    try:

        tickers = [symbol, "SPY"] if symbol != "SPY" else [symbol, "QQQ"]
        
        df_dict = {}
        for tick in tickers:
            try:
                # FIX 5: TIMEOUT PROTECTION
                df_raw = yf.download(tick, start="2016-01-01", end="2026-01-01", progress=False, timeout=10)
                if df_raw is not None and not df_raw.empty:
                    if isinstance(df_raw.columns, pd.MultiIndex):
                        df_raw.columns = df_raw.columns.get_level_values(0)
                    df_dict[tick] = df_raw
            except Exception:
                continue
                
        if symbol not in df_dict or df_dict[symbol].empty:
            return {"status": "error", "message": "No data found for symbol"}
            
        target_df = df_dict[symbol]
        
        horizons = {"1d": 1, "7d": 7, "30d": 30}
        predictions = pd.DataFrame(index=target_df.index)
        
        model_metrics = {}
        
        for h_name, h_days in horizons.items():
            
            if h_name == "1d":
                lookback_years = 4 
            elif h_name == "7d":
                lookback_years = 7 
            else:
                lookback_years = 10 
                
            lookback_days = lookback_years * 252
            
            train_features_list = []
            test_df = None
            
            for tick, raw_data in df_dict.items():
                filtered_raw = raw_data.iloc[-lookback_days:].copy() if len(raw_data) > lookback_days else raw_data.copy()
                
                df_features = build_features(filtered_raw, horizon=h_name, is_training=True)
                
                if len(df_features) < 100:
                    continue
                    
                split = int(len(df_features) * 0.8)
                train_part = df_features.iloc[:split].copy()
                
                train_features_list.append(train_part)
                
                # Only keep the test set for our actual target symbol
                if tick == symbol:
                    test_df = df_features.iloc[split:].copy()
            
            if test_df is None or len(train_features_list) == 0:
                return {"status": "error", "message": f"Not enough data points for {h_name} model"}
                
            # Combine multiple stocks into one generalized training set
            train_df = pd.concat(train_features_list, ignore_index=True)
            
            features = [col for col in df_features.columns if col not in ['target', 'target_class', 'Open', 'High', 'Low', 'Close', 'Volume']]
            
            X_train = train_df[features]
            y_train = train_df['target_class']
            X_test = test_df[features]
            y_test = test_df['target_class']
            
           
            depth = 4 if h_name == "1d" else (5 if h_name == "7d" else 6)
            
            model = XGBClassifier(n_estimators=300, max_depth=depth, learning_rate=0.05, random_state=42, eval_metric='logloss')
            model.fit(X_train, y_train)
            
            probs = model.predict_proba(X_test)[:, 1]
            preds = (probs > 0.5).astype(int)
            accuracy = accuracy_score(y_test, preds)
            
        
            test_df[f'prob_{h_name}'] = probs
            test_df[f'target_{h_name}'] = test_df['target']
            
           
            predictions = predictions.join(test_df[[f'prob_{h_name}', f'target_{h_name}']], how='left')
            
            model_metrics[h_name] = {"accuracy": accuracy}
            
        # Drop rows where we don't have predictions from all models 
        predictions = predictions.dropna(subset=[f'prob_{h}' for h in horizons.keys()])
        
        if predictions.empty:
            return {"status": "error", "message": "Failed to align test predictions"}
            
       
        # We will use the 30-day horizon as our main holding period.
        HOLDING_PERIOD = 30
        TRANSACTION_COST = 0.001 
        
        in_trade = False
        days_in_trade = 0
        trade_returns = []
        equity_curve = [1.0] 
        
        trades_taken = 0
        winning_trades = 0
        
        for idx, row in predictions.iterrows():
            prob_30d = row['prob_30d']
            prob_7d = row['prob_7d']
            prob_1d = row['prob_1d']
            
            # Multi-Horizon Decision Logic
            is_strong_buy = prob_30d > 0.55 and prob_7d > 0.55 and prob_1d > 0.55
            is_buy_dip = prob_30d > 0.55 and prob_7d > 0.55 and prob_1d < 0.50
            
            signal = is_strong_buy or is_buy_dip
            
            if in_trade:
                days_in_trade += 1
                # If holding period is reached, exit trade
                if days_in_trade >= HOLDING_PERIOD:
                    in_trade = False
                    days_in_trade = 0
            else:
                if signal:
                    # Enter trade
                    in_trade = True
                    days_in_trade = 0
                    trades_taken += 1
                    
                    # The return over the next 30 days is our target_30d
                    raw_return = row['target_30d']
                    # Apply transaction costs (Entry + Exit)
                    net_return = raw_return - (TRANSACTION_COST * 2)
                    
                    trade_returns.append(net_return)
                    if net_return > 0:
                        winning_trades += 1
                        
                    # Update equity curve
                    equity_curve.append(equity_curve[-1] * (1 + net_return))
        
        
        total_strategy_return = (equity_curve[-1] - 1) if equity_curve else 0
        win_rate = winning_trades / trades_taken if trades_taken > 0 else 0
        avg_trade_return = np.mean(trade_returns) if trade_returns else 0
        
        start_price = target_df.loc[predictions.index[0]]['Close']
        end_price = target_df.loc[predictions.index[-1]]['Close']
        buy_and_hold_return = (end_price / start_price) - 1
        
        equity_series = pd.Series(equity_curve)
        rolling_max = equity_series.cummax()
        drawdowns = (equity_series - rolling_max) / rolling_max
        max_drawdown = float(drawdowns.min()) if not drawdowns.empty else 0.0
        
        latest = predictions.iloc[-1]
        p30, p7, p1 = latest['prob_30d'], latest['prob_7d'], latest['prob_1d']
        
        def get_horizon_metrics(p, h_name):
            conf = "HIGH" if p > 0.58 else ("MEDIUM" if p >= 0.52 else "LOW")
            signal_str = "BUY" if p > 0.52 else ("SELL" if p < 0.48 else "NEUTRAL")
            
            # Calculate average return of historical positive targets for this horizon
            mask = (predictions[f'prob_{h_name}'] > 0.50) & (predictions[f'target_{h_name}'] > 0)
            if mask.sum() > 5:
                wins = predictions.loc[mask, f'target_{h_name}'] * 100
                avg = float(wins.mean())
                std = float(wins.std()) if len(wins) > 1 else 1.0
                lb = avg - (std/2)
                if lb < 0: lb = 0.1
                ub = avg + std
                exp_ret = f"{'+' if lb > 0 else ''}{lb:.1f}% to {'+' if ub > 0 else ''}{ub:.1f}%"
            else:
                exp_ret = "N/A"
            return signal_str, conf, exp_ret

        trend_1d_str, conf_1d, exp_1d = get_horizon_metrics(p1, '1d')
        trend_7d_str, conf_7d, exp_7d = get_horizon_metrics(p7, '7d')
        trend_30d_str, conf_30d, exp_30d = get_horizon_metrics(p30, '30d')
        
        trend_30d = "Bullish" if p30 > 0.52 else ("Bearish" if p30 < 0.48 else "Neutral")
        trend_7d = "Bullish" if p7 > 0.52 else ("Bearish" if p7 < 0.48 else "Neutral")
        trend_1d = "Bullish" if p1 > 0.52 else ("Pullback" if p1 < 0.48 else "Neutral")
        
        final_conf_str = "HIGH" if p30 > 0.58 else ("MEDIUM" if p30 >= 0.52 else "LOW")
        
        if p30 > 0.52 and p7 > 0.52 and p1 > 0.52:
            latest_signal = "BUY"
            allocation = "10%"
        elif p30 > 0.52 and p7 > 0.52 and p1 <= 0.52:
            latest_signal = "BUY DIP"
            allocation = "8%"
        elif p30 > 0.52 and p7 <= 0.52:
            latest_signal = "WAIT"
            allocation = "0%"
        elif p30 < 0.48:
            latest_signal = "SELL"
            allocation = "0%"
        else:
            latest_signal = "NEUTRAL"
            allocation = "0%"
            
        def decide_action(s1d, s7d, s30d, holding):
            s1d = "AVOID" if s1d == "NEUTRAL" else s1d
            s7d = "AVOID" if s7d == "NEUTRAL" else s7d
            s30d = "AVOID" if s30d == "NEUTRAL" else s30d
            
            if not holding:
                if s30d == "BUY":
                    if s7d == "BUY": return {"action": "STRONG_BUY", "reason": "Macro + Swing aligned"}
                    elif s7d == "SELL": return {"action": "WAIT", "reason": "Mid-term downtrend"}
                    elif s1d == "SELL": return {"action": "WAIT", "reason": "Pullback expected"}
                    else: return {"action": "BUY", "reason": "Macro trend positive"}
                elif s30d == "SELL": return {"action": "AVOID", "reason": "Macro bearish"}
                else:
                    if s7d == "BUY": return {"action": "BUY", "reason": "Swing opportunity (macro neutral)"}
                    elif s7d == "SELL": return {"action": "AVOID", "reason": "No momentum"}
                    elif s1d == "BUY": return {"action": "WAIT", "reason": "Short-term bounce only"}
                    else: return {"action": "AVOID", "reason": "Dead market"}
            else:
                if s30d == "SELL": return {"action": "EXIT_ALL", "reason": "Macro reversal"}
                elif s30d == "AVOID":
                    if s7d == "SELL": return {"action": "EXIT_ALL", "reason": "Trend breakdown"}
                    elif s1d == "SELL": return {"action": "PARTIAL_EXIT", "size": "50%", "reason": "Momentum fading"}
                    else: return {"action": "HOLD", "reason": "No strong signal"}
                else:
                    if s7d == "SELL": return {"action": "PARTIAL_EXIT", "size": "50%", "reason": "Pullback"}
                    elif s7d == "BUY": return {"action": "HOLD", "reason": "Trend strong"}
                    else: return {"action": "HOLD", "reason": "Stable trend"}

        action_not_holding = decide_action(trend_1d_str, trend_7d_str, trend_30d_str, holding=False)
        action_holding = decide_action(trend_1d_str, trend_7d_str, trend_30d_str, holding=True)
            
        abs_dd = abs(max_drawdown)
        risk_level = "LOW" if abs_dd < 0.10 else ("MEDIUM" if abs_dd < 0.25 else "HIGH")
        
        # Fetch the very last row of raw features for the 30d model to extract live indicators
        df_latest_features = build_features(target_df, horizon="30d", is_training=False).iloc[-1]
        
        reasons = []
        if df_latest_features.get('trend_regime', 0) == 1:
            reasons.append("Strong uptrend (SMA50 > SMA200)")
        else:
            reasons.append("Weak trend structure (SMA50 < SMA200)")
            
        if df_latest_features.get('RSI', 50) > 60:
            reasons.append("Strong positive momentum (RSI > 60)")
        elif df_latest_features.get('RSI', 50) < 40:
            reasons.append("Oversold / Negative momentum (RSI < 40)")
            
        vol_reg = df_latest_features.get('vol_regime', 1)
        if vol_reg < 0.8:
            reasons.append("Volatility is contracting (safe environment)")
        elif vol_reg > 1.2:
            reasons.append("High volatility regime (elevated risk)")
            
        return {
            "status": "success",
            "symbol": symbol.upper(),
            "finalSignal": latest_signal,
            "confidenceLevel": final_conf_str,
            "confidenceScore": round(p30 * 100, 1),
            "riskLevel": risk_level,
            "multiHorizon": {
                "1d": {"signal": trend_1d_str, "expectedReturn": exp_1d, "confidence": conf_1d},
                "7d": {"signal": trend_7d_str, "expectedReturn": exp_7d, "confidence": conf_7d},
                "30d": {"signal": trend_30d_str, "expectedReturn": exp_30d, "confidence": conf_30d}
            },
            "actionNotHolding": action_not_holding,
            "actionHolding": action_holding,
            "suggestedAllocation": allocation,
            "reasons": reasons,
            "modelAccuracy": round(float(model_metrics.get("30d", {}).get("accuracy", 0)) * 100, 1),
            "winRate": round(float(win_rate) * 100, 1),
            "maxDrawdown": round(float(max_drawdown) * 100, 1),
            "strategySumReturn": round(float(total_strategy_return) * 100, 1),
            "buyAndHoldReturn": round(float(buy_and_hold_return) * 100, 1),
            "tradesTaken": trades_taken
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
