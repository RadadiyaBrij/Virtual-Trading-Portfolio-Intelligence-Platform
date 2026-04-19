from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
import math

SECTOR_PROFILES = {
    "banking": {"label": "Banking", "ignore": ["debt_equity", "cash_cycle", "asset_turnover"], "focus": ["roe", "pb"], "notes": "Banks use leverage; D/E is ignored."},
    "it_services": {"label": "IT Services", "ignore": ["pb"], "focus": ["roe", "sales_growth"], "notes": "Asset-light; P/B is misleading."},
    "manufacturing": {"label": "Manufacturing", "ignore": [], "focus": ["debt_equity", "asset_turnover"], "notes": "Capital-intensive; check efficiency."},
    "psu": {"label": "PSU", "ignore": [], "focus": ["dividend_yield", "roe"], "notes": "High dividends are standard."},
    "general": {"label": "General", "ignore": [], "focus": [], "notes": "Standard scoring applied."},
}

SECTOR_MAP = {
    "financial services": "banking", "financials": "banking", "banks": "banking",
    "technology": "it_services", "information technology": "it_services",
    "industrials": "manufacturing", "materials": "manufacturing", "energy": "psu", "utilities": "psu"
}

def detect_sector_profile(sector_str: str) -> str:
    if not sector_str: return "general"
    return SECTOR_MAP.get(sector_str.strip().lower(), "general")

@dataclass
class StockFundamentals:
    roe: Optional[float] = None; roce: Optional[float] = None; pat_margin: Optional[float] = None     
    sales_growth: Optional[float] = None; profit_growth: Optional[float] = None; eps: Optional[float] = None            
    debt_equity: Optional[float] = None; cash: Optional[float] = None; enterprise_value: Optional[float] = None
    market_cap: Optional[float] = None; total_debt: Optional[float] = None; pe: Optional[float] = None             
    forward_pe: Optional[float] = None; pb: Optional[float] = None; book_value: Optional[float] = None
    promoter_holding: Optional[float] = None; pledged_shares: Optional[float] = None; promoter_holding_trend: Optional[str] = None  
    asset_turnover: Optional[float] = None; cash_cycle: Optional[float] = None; dividend_yield: Optional[float] = None  
    sector: Optional[str] = None; industry: Optional[str] = None; symbol: Optional[str] = None; name: Optional[str] = None
    current_price: Optional[float] = None; price_change_percent: Optional[float] = None; roe_trend: Optional[str] = None        
    profit_trend: Optional[str] = None; debt_trend: Optional[str] = None

@dataclass
class ParameterScore:
    name: str; value: Any; max_points: float; earned_points: float; reasoning: str; is_ignored: bool = False  

@dataclass
class GroupScore:
    group_name: str; weight: int; max_points: float; earned_points: float; parameters: List[ParameterScore] = field(default_factory=list)

@dataclass
class ExceptionRule:
    rule: str; adjustment: float; reasoning: str

@dataclass
class ScoringResult:
    symbol: str; name: str; sector_profile: str; sector_label: str; total_score: float; rating: str; suggestion: str; allocation_percent: str     
    group_scores: List[GroupScore] = field(default_factory=list); exceptions: List[ExceptionRule] = field(default_factory=list)
    timing_signal: str = "Neutral"; timing_reasoning: str = ""; context_adjustments: float = 0.0; sector_notes: str = ""
    def to_dict(self) -> dict: return asdict(self)

class FinancialScoringEngine:
    GROUP_WEIGHTS = {"profitability": 25, "growth": 20, "financial_health": 20, "valuation": 15, "ownership": 10, "efficiency": 10}
    def __init__(self):
        self._gs = {"profitability": self._sp, "growth": self._sg, "financial_health": self._sf, "valuation": self._sv, "ownership": self._so, "efficiency": self._se}

    def score(self, d: StockFundamentals) -> ScoringResult:
        sk = detect_sector_profile(d.sector); p = SECTOR_PROFILES[sk]; ign = set(p.get("ignore", []))
        gs_list = []; rt = 0.0
        for gn, w in self.GROUP_WEIGHTS.items():
            gs = self._gs[gn](d, w, ign); gs_list.append(gs); rt += gs.earned_points
        ca = self._dc(d); ex = self._ee(d)
        fs = round(max(0, min(100, rt + ca + sum(e.adjustment for e in ex))), 1)
        ts, tr = self._tl(d)
        return ScoringResult(d.symbol or "UNK", d.name or "Unknown", sk, p["label"], fs, self._gr(fs), self._gsug(fs), self._ga(fs), gs_list, ex, ts, tr, ca + sum(e.adjustment for e in ex), p.get("notes", ""))

    def _calculate_group_score(self, name, weight, params):
        # Filter out ignored parameters
        active_params = [p for p in params if not p.is_ignored]
        
        if not active_params:
            return GroupScore(name, weight, weight, 0, params)
            
        sum_earned = sum(p.earned_points for p in active_params)
        sum_max = sum(p.max_points for p in active_params)
        
        # Normalize: (Earned / Max Available) * Group Weight
        normalized_earned = (sum_earned / sum_max) * weight if sum_max > 0 else 0
        
        return GroupScore(name, weight, weight, round(normalized_earned, 2), params)

    def _sp(self, d, w, ign): # Profitability
        pts = [self._scm("roe", d.roe, ign, 10, lambda v: 10 if v>=20 else 7 if v>=15 else 4 if v>=10 else 2 if v>=5 else 0, lambda v, s: f"ROE={v}%"),
               self._scm("roce", d.roce, ign, 8, lambda v: 8 if v>=20 else 6 if v>=15 else 3 if v>=10 else 0, lambda v, s: f"ROCE={v}%"),
               self._scm("pat_margin", d.pat_margin, ign, 7, lambda v: 7 if v>=20 else 5 if v>=15 else 3 if v>=10 else 0, lambda v, s: f"PAT={v}%")]
        return self._calculate_group_score("Profitability", w, pts)

    def _sg(self, d, w, ign): # Growth
        pts = [self._scm("sales_growth", d.sales_growth, ign, 10, lambda v: 10 if v>=20 else 7 if v>=10 else 4 if v>=5 else 0, lambda v, s: f"Sales={v}%"),
               self._scm("profit_growth", d.profit_growth, ign, 10, lambda v: 10 if v>=20 else 7 if v>=10 else 4 if v>=5 else 0, lambda v, s: f"Profit={v}%")]
        return self._calculate_group_score("Growth", w, pts)

    def _sf(self, d, w, ign): # Health
        pts = [self._scm("debt_equity", d.debt_equity, ign, 10, lambda v: 10 if v<=0.1 else 8 if v<=0.3 else 5 if v<=0.5 else 3 if v<=1 else 0, lambda v, s: f"D/E={v}"),
               self._scm("cash", d.cash, ign, 5, lambda v: 5 if d.market_cap and v/d.market_cap > 0.3 else 2 if v else 0, lambda v, s: "Cash"),
               self._scm("enterprise_value", d.enterprise_value, ign, 5, lambda v: 5 if d.market_cap and v<d.market_cap else 1, lambda v, s: "EV/MCap")]
        return self._calculate_group_score("Financial Health", w, pts)

    def _sv(self, d, w, ign): # Valuation
        pts = [self._scm("pe", d.pe, ign, 7, lambda v: 7 if 0<v<=15 else 5 if v<=25 else 3 if v<=40 else 0, lambda v, s: f"P/E={v}"),
               self._scm("pb", d.pb, ign, 5, lambda v: 5 if v<=1.5 else 3 if v<=5 else 0, lambda v, s: f"P/B={v}"),
               self._scm("ev_vs_mcap", d.market_cap, ign, 3, lambda v: 3 if d.enterprise_value and d.enterprise_value < v else 0, lambda v, s: "Net Cash")]
        return self._calculate_group_score("Valuation", w, pts)

    def _so(self, d, w, ign): # Ownership
        pts = [self._scm("promoter_holding", d.promoter_holding, ign, 5, lambda v: 5 if v>=50 else 3 if v>=35 else 0, lambda v, s: f"Promoter={v}%"),
               self._scm("pledged_shares", d.pledged_shares, ign, 3, lambda v: 3 if v<=1 else 0, lambda v, s: f"Pledged={v}%"),
               self._scm("promoter_holding_trend", d.promoter_holding_trend, ign, 2, lambda v: 2 if str(v).lower()=="increasing" else 1, lambda v, s: "Trend")]
        return self._calculate_group_score("Ownership", w, pts)

    def _se(self, d, w, ign): # Efficiency
        pts = [self._scm("asset_turnover", d.asset_turnover, ign, 10, lambda v: 5 if v>=2 else 3 if v>=1 else 0, lambda v, s: f"Turnover={v}x"),
               self._scm("cash_cycle", d.cash_cycle, ign, 5, lambda v: 5 if v<0 else 3 if v<=60 else 0, lambda v, s: f"Cycle={v}d")]
        return self._calculate_group_score("Efficiency", w, pts)

    def _dc(self, d): # Dividend Context
        if d.dividend_yield is None or d.sales_growth is None: return 0
        return 5 if d.dividend_yield > 4 and d.sales_growth > 10 else 3 if d.dividend_yield < 1 and d.sales_growth > 15 else 0

    def _ee(self, d): # Exceptions
        r = []
        if d.roe and d.roe>20 and d.debt_equity and d.debt_equity>1: r.append(ExceptionRule("High Roe-Debt", -5, "Leveraged ROE"))
        if d.pe and d.pe>40 and d.profit_growth and d.profit_growth>25: r.append(ExceptionRule("Growth-Valuation", 3, "Growth justifies P/E"))
        if d.pledged_shares and d.pledged_shares > 50: r.append(ExceptionRule("High Pledge", -6, "High leverage risk"))
        return r

    def _tl(self, d): # Timing
        p = (1 if str(d.roe_trend).lower()=="increasing" else 0) + (1 if d.profit_growth and d.profit_growth>15 else 0)
        return ("Strong Entry", "Positive trends") if p >= 2 else ("Neutral", "Limited data")

    def _gr(self, s): return "Strong" if s>=80 else "Moderate-Strong" if s>=65 else "Moderate" if s>=50 else "Weak-Moderate" if s>=35 else "Weak"
    def _gsug(self, s): return "High Conviction" if s>=80 else "Good Candidate" if s>=65 else "Watchlist" if s>=50 else "Risky"
    def _ga(self, s): return "40-50%" if s>=80 else "25-35%" if s>=65 else "10-20%" if s>=50 else "0%"

    def _scm(self, n, v, ign, mp, sc, re): # Parameter scoring
        if n in ign or v is None: return ParameterScore(n, v, mp, 0, "Ignored" if n in ign else "N/A", True)
        pts = min(sc(v), mp)
        return ParameterScore(n, v, mp, pts, re(v, pts))

def extract_fundamentals_from_yfinance(symbol: str) -> StockFundamentals:
    import yfinance as yf
    t = yf.Ticker(symbol); i = t.info
    def g(k, d=None):
        v = i.get(k, d)
        return d if v is None or (isinstance(v, float) and math.isnan(v)) else v
    rev, ast, debt, eq = g("totalRevenue", 0), g("totalAssets", 0), g("totalDebt", 0), g("totalStockholderEquity", 0)
    return StockFundamentals(roe=round(g("returnOnEquity",0)*100,2), pat_margin=round(g("profitMargins",0)*100,2), sales_growth=round(g("revenueGrowth",0)*100,2), profit_growth=round(g("earningsGrowth",0)*100,2), debt_equity=round(debt/eq, 2) if eq else None, cash=g("totalCash"), enterprise_value=g("enterpriseValue"), market_cap=g("marketCap"), pe=g("trailingPE"), pb=g("priceToBook"), dividend_yield=round(g("dividendYield",0)*100,2), sector=g("sector"), industry=g("industry"), symbol=symbol, name=g("shortName", symbol), eps=g("trailingEps"), book_value=g("bookValue"), asset_turnover=round(rev/ast, 2) if ast else None)

def analyze_stock(symbol: str) -> dict:
    f = extract_fundamentals_from_yfinance(symbol); res = FinancialScoringEngine().score(f)
    def to_camel(d):
        if isinstance(d, list): return [to_camel(i) for i in d]
        if isinstance(d, dict): return { "".join(x.capitalize() if i>0 else x for i,x in enumerate(k.split("_"))): to_camel(v) for k,v in d.items() }
        return d
    out = to_camel(asdict(res)); out["groups"] = out.pop("groupScores")
    return { **out, "fundamentals": to_camel(asdict(f)) }
