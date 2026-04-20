from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
import math

SECTOR_PROFILES = {
    "banking": {
        "label": "Banking", 
        "ignore": ["debt_equity"], 
        "roe_thresholds": {"good": 15, "avg": 10},
        "pat_thresholds": {"good": 15, "avg": 8},
        "roce_thresholds": {"good": 12, "avg": 8},
        "pe_thresholds": {"good": 12, "avg": 20},
        "notes": "Banks use leverage; D/E is ignored."
    },
    "it_services": {
        "label": "IT Services", 
        "ignore": ["pb"], 
        "roe_thresholds": {"good": 22, "avg": 12},
        "pat_thresholds": {"good": 18, "avg": 12},
        "roce_thresholds": {"good": 25, "avg": 15},
        "pe_thresholds": {"good": 20, "avg": 35},
        "notes": "Asset-light; P/B is often inflated."
    },
    "manufacturing": {
        "label": "Manufacturing", 
        "ignore": [], 
        "roe_thresholds": {"good": 18, "avg": 10},
        "pat_thresholds": {"good": 12, "avg": 8},
        "roce_thresholds": {"good": 18, "avg": 10},
        "pe_thresholds": {"good": 15, "avg": 25},
        "is_capex_heavy": True,
        "notes": "Capital-intensive; check efficiency."
    },
    "psu": {
        "label": "Energy & PSU", 
        "ignore": [], 
        "roe_thresholds": {"good": 12, "avg": 6},
        "pat_thresholds": {"good": 10, "avg": 5},
        "roce_thresholds": {"good": 12, "avg": 8},
        "pe_thresholds": {"good": 10, "avg": 18},
        "is_capex_heavy": True,
        "notes": "High dividends; utility-like stable ROE."
    },
    "consumer": {
        "label": "Consumer/FMCG",
        "ignore": [],
        "roe_thresholds": {"good": 25, "avg": 15},
        "pat_thresholds": {"good": 20, "avg": 12},
        "roce_thresholds": {"good": 30, "avg": 18},
        "pe_thresholds": {"good": 35, "avg": 50},
        "notes": "High brand value leads to superior ROE."
    },
    "general": {
        "label": "General", 
        "ignore": [], 
        "roe_thresholds": {"good": 15, "avg": 10},
        "pat_thresholds": {"good": 15, "avg": 10},
        "roce_thresholds": {"good": 15, "avg": 10},
        "pe_thresholds": {"good": 15, "avg": 25},
        "notes": "Standard scoring applied."
    },
}


SECTOR_MAP = {
    "financial services": "banking", "financials": "banking", "banks": "banking",
    "technology": "it_services", "information technology": "it_services", "software": "it_services",
    "industrials": "manufacturing", "materials": "manufacturing", "automotive": "manufacturing",
    "energy": "psu", "utilities": "psu", "oil & gas": "psu", "power": "psu",
    "consumer defensive": "consumer", "consumer cyclical": "consumer", "fmcg": "consumer", "retail": "consumer"
}

def detect_sector_profile(sector_str: str) -> str:
    if not sector_str: return "general"
    s = sector_str.strip().lower()
    if s in SECTOR_MAP: return SECTOR_MAP[s]
    # Fuzzy matching
    if any(k in s for k in ["bank", "finance", "invest"]): return "banking"
    if any(k in s for k in ["tech", "software", "it"]): return "it_services"
    if any(k in s for k in ["oil", "gas", "energy", "power", "utility"]): return "psu"
    if any(k in s for k in ["manufact", "industr", "auto", "steel", "metal", "iron", "copper"]): return "manufacturing"
    if any(k in s for k in ["food", "beverag", "consumer", "retail", "fmcg"]): return "consumer"
    if any(k in s for k in ["pharma", "health", "biotech"]): return "manufacturing"
    if any(k in s for k in ["real estate", "realty", "construct", "infra"]): return "psu"
    return "general"



@dataclass
class StockFundamentals:
    roe: Optional[float] = None; roce: Optional[float] = None; pat_margin: Optional[float] = None     
    sales_growth: Optional[float] = None; profit_growth: Optional[float] = None; eps: Optional[float] = None            
    debt_equity: Optional[float] = None; cash: Optional[float] = None; enterprise_value: Optional[float] = None
    market_cap: Optional[float] = None; total_debt: Optional[float] = None; pe: Optional[float] = None             
    forward_pe: Optional[float] = None; pb: Optional[float] = None; book_value: Optional[float] = None
    dividend_yield: Optional[float] = None; sector: Optional[str] = None; industry: Optional[str] = None
    symbol: Optional[str] = None; name: Optional[str] = None; current_price: Optional[float] = None
    price_change_percent: Optional[float] = None; roe_trend: Optional[str] = None; profit_trend: Optional[str] = None
    debt_trend: Optional[str] = None


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
    GROUP_WEIGHTS = {"profitability": 30, "growth": 25, "financial_health": 25, "valuation": 20}
    def __init__(self):
        self._gs = {"profitability": self._sp, "growth": self._sg, "financial_health": self._sf, "valuation": self._sv}


    def score(self, d: StockFundamentals) -> ScoringResult:
        sk = detect_sector_profile(d.sector); p = SECTOR_PROFILES[sk]; ign = set(p.get("ignore", []))
        gs_list = []; rt = 0.0
        for gn, w in self.GROUP_WEIGHTS.items():
            gs = self._gs[gn](d, w, ign, p)
            gs_list.append(gs)
            rt += gs.earned_points

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

    def _sp(self, d, w, ign, p): # Profitability
        # Fetch sector-aware thresholds
        roe_t = p.get("roe_thresholds", {"good": 15, "avg": 10})
        roce_t = p.get("roce_thresholds", {"good": 15, "avg": 10})
        pat_t = p.get("pat_thresholds", {"good": 15, "avg": 10})
        
        def score_metric(v, t, mp):
            if v is None: return 0
            if v >= t["good"]: return mp
            if v >= t["avg"]: return int(mp * 0.7)
            # Intelligent Context Overrides
            if d.debt_equity is not None and d.debt_equity < 0.4 and v >= (t["avg"] * 0.7): return int(mp * 0.6)
            if d.profit_growth and d.profit_growth > 20 and v >= (t["avg"] * 0.5): return int(mp * 0.5)

            if v >= (t["avg"] * 0.5): return int(mp * 0.3)
            return 0

        pts = [self._scm("roe", d.roe, ign, 10, lambda v: score_metric(v, roe_t, 10), lambda v, s: f"ROE={v}%"),
               self._scm("roce", d.roce, ign, 8, lambda v: score_metric(v, roce_t, 8), lambda v, s: f"ROCE={v}%"),
               self._scm("pat_margin", d.pat_margin, ign, 7, lambda v: score_metric(v, pat_t, 7), lambda v, s: f"PAT={v}%")]
        return self._calculate_group_score("Profitability", w, pts)


    def _sg(self, d, w, ign, p): # Growth
        pts = [self._scm("sales_growth", d.sales_growth, ign, 10, lambda v: 10 if v>=20 else 7 if v>=10 else 4 if v>=5 else 0, lambda v, s: f"Sales={v}%"),
               self._scm("profit_growth", d.profit_growth, ign, 10, lambda v: 10 if v>=20 else 7 if v>=10 else 4 if v>=5 else 0, lambda v, s: f"Profit={v}%")]
        return self._calculate_group_score("Growth", w, pts)

    def _sf(self, d, w, ign, p): # Health
        pts = [self._scm("debt_equity", d.debt_equity, ign, 10, lambda v: 10 if v<=0.1 else 8 if v<=0.3 else 5 if v<=0.5 else 3 if v<=1 else 0, lambda v, s: f"D/E={v}"),
               self._scm("cash", d.cash, ign, 5, lambda v: 5 if d.market_cap and v/d.market_cap > 0.3 else 2 if v else 0, lambda v, s: "Cash"),
               self._scm("enterprise_value", d.enterprise_value, ign, 5, lambda v: 5 if d.market_cap and v<d.market_cap else 1, lambda v, s: "EV/MCap")]
        return self._calculate_group_score("Financial Health", w, pts)

    def _sv(self, d, w, ign, p): # Valuation
        pe_t = p.get("pe_thresholds", {"good": 15, "avg": 25})
        
        def pe_score(v):
            if not v or v <= 0: return 0
            if v <= pe_t["good"]: return 7
            if v <= pe_t["avg"]: return 5
            if v <= (pe_t["avg"] * 1.5): return 3
            return 0

        pts = [self._scm("pe", d.pe, ign, 7, pe_score, lambda v, s: f"P/E={v}"),
               self._scm("pb", d.pb, ign, 5, lambda v: 5 if v<=1.5 else 3 if v<=5 else 0, lambda v, s: f"P/B={v}"),
               self._scm("ev_vs_mcap", d.market_cap, ign, 3, lambda v: 3 if d.enterprise_value and v and v > 0 and (d.enterprise_value / v) < 1.0 else 1 if d.enterprise_value and v and v > 0 and (d.enterprise_value / v) < 1.2 else 0, lambda v, s: "EV/MCap")]

        return self._calculate_group_score("Valuation", w, pts)


    def _dc(self, d): # Dividend Context
        if d.dividend_yield is None or d.sales_growth is None: return 0
        return 5 if d.dividend_yield > 4 and d.sales_growth > 10 else 3 if d.dividend_yield < 1 and d.sales_growth > 15 else 0

    def _ee(self, d): # Exceptions
        r = []
        if d.roe and d.roe>20 and d.debt_equity and d.debt_equity>1: r.append(ExceptionRule("High Roe-Debt", -5, "Leveraged ROE"))
        if d.pe and d.pe>40 and d.profit_growth and d.profit_growth>25: r.append(ExceptionRule("Growth-Valuation", 3, "Growth justifies P/E"))
        return r

    def _tl(self, d): # Timing
        score = 0
        if d.profit_growth and d.profit_growth > 20: score += 2
        elif d.profit_growth and d.profit_growth > 10: score += 1
        
        if d.sales_growth and d.sales_growth > 15: score += 1
        if d.debt_equity is not None and d.debt_equity < 0.5: score += 1
        if d.roe and d.roe > 15: score += 1
        
        if score >= 4: return ("Strong Entry", "Excellent fundamental alignment")
        if score >= 2: return ("Watch", "Improving trends")
        return ("Neutral", "Limited momentum")




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
    is_usd = not (symbol.endswith('.NS') or symbol.endswith('.BO'))
    ex = 83.0 if is_usd else 1.0

    def g(k, d=None):
        v = i.get(k, d)
        return d if v is None or (isinstance(v, float) and math.isnan(v)) else v
    
    # Raw info extraction
    ni = g("netIncomeToCommon")
    rev = g("totalRevenue")
    ast = g("totalAssets")
    debt = g("totalDebt")
    eq = g("totalStockholderEquity")
    price = g("currentPrice")
    mcap = g("marketCap")
    cash = g("totalCash")
    ev = g("enterpriseValue")
    bv = g("bookValue")
    shares = g("sharesOutstanding")
    ebit = g("ebit")
    cur_liab = g("totalCurrentLiabilities")
    
    rev_growth = g("revenueGrowth")
    earn_growth = g("earningsGrowth")

    # Primary Metrics with Fallbacks
    roe = g("returnOnEquity")
    if roe is None and ni:
        if eq and eq > 0: roe = ni / eq
        elif bv and shares and (bv * shares) > 0: roe = ni / (bv * shares)
    
    pat_margin = g("profitMargins")
    if pat_margin is None and ni and rev and rev > 0:
        pat_margin = ni / rev


    # Real ROCE Calculation
    roce = None
    if ebit and ast:
        cap_employed = ast - (cur_liab or 0)
        if cap_employed > 0:
            roce = ebit / cap_employed

    # Estimated ROE and Growth
    roe_val = round(roe * 100, 2) if roe is not None else None
    roce_val = round(roce * 100, 2) if roce is not None else None
    pat_val = round(pat_margin * 100, 2) if pat_margin is not None else None

    # Debt to Equity normalization
    effective_equity = eq if (eq and eq > 0) else (bv * shares if (bv and shares and bv*shares > 0) else None)
    de_ratio = round(debt / effective_equity, 2) if debt is not None and effective_equity else None


    return StockFundamentals(
        roe=roe_val,
        roce=roce_val,
        pat_margin=pat_val,
        sales_growth=round(rev_growth * 100, 2) if rev_growth is not None else None,
        profit_growth=round(earn_growth * 100, 2) if earn_growth is not None else None,
        debt_equity=de_ratio,

        total_debt=debt * ex if debt else None,

        cash=cash * ex if cash else None,
        enterprise_value=ev * ex if ev else None,
        market_cap=mcap * ex if mcap else None,
        pe=g("trailingPE"),
        forward_pe=g("forwardPE"),
        pb=g("priceToBook"),
        dividend_yield=round(g("dividendYield", 0) * 100, 2) if g("dividendYield") is not None else None,
        sector=g("sector"),
        industry=g("industry"),
        symbol=symbol,
        name=g("shortName", symbol),
        eps=g("trailingEps"),
        book_value=bv * ex if bv else None,
        current_price=price * ex if price else None
    )




def analyze_stock(symbol: str) -> dict:
    f = extract_fundamentals_from_yfinance(symbol); res = FinancialScoringEngine().score(f)
    def to_camel(d):
        if isinstance(d, list): return [to_camel(i) for i in d]
        if isinstance(d, dict): return { "".join(x.capitalize() if i>0 else x for i,x in enumerate(k.split("_"))): to_camel(v) for k,v in d.items() }
        return d
    out = to_camel(asdict(res)); out["groups"] = out.pop("groupScores")
    return { **out, "fundamentals": to_camel(asdict(f)) }
