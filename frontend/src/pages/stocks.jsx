import React, { useState, useEffect, useMemo } from 'react';
import { FiRefreshCw, FiSearch } from 'react-icons/fi';
import StockTableRow from '../components/market/StockTableRow';

export default function Stocks() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [region, setRegion] = useState('india');
  const [searchQuery, setSearchQuery] = useState('');

  const nifty50Symbols = 'RELIANCE.NS,TCS.NS,HDFCBANK.NS,ICICIBANK.NS,BHARTIARTL.NS,INFY.NS,SBIN.NS,HINDUNILVR.NS,ITC.NS,LT.NS,BAJFINANCE.NS,HCLTECH.NS,MARUTI.NS,SUNPHARMA.NS,TMPV.NS,KOTAKBANK.NS,M&M.NS,ONGC.NS,NTPC.NS,TITAN.NS,ADANIPORTS.NS,ASIANPAINT.NS,ULTRACEMCO.NS,POWERGRID.NS,BAJAJFINSV.NS,WIPRO.NS,COALINDIA.NS,INDUSINDBK.NS,TATASTEEL.NS,GRASIM.NS,BAJAJ-AUTO.NS,TECHM.NS,HINDALCO.NS,ADANIENT.NS,CIPLA.NS,DRREDDY.NS,EICHERMOT.NS,DIVISLAB.NS,APOLLOHOSP.NS,TATACONSUM.NS,HEROMOTOCO.NS,BRITANNIA.NS,UPL.NS,SBILIFE.NS,HDFCLIFE.NS,BPCL.NS,SHREECEM.NS,HDFCAMC.NS,PIDILITIND.NS,VEDL.NS';

  const indianSymbols = nifty50Symbols;
  const globalSymbols = 'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,BRK-B,LLY,V,TSM,JPM,UNH,WMT,MA,JNJ,PG,HD,ORCL,AVGO,CVX,MRK,ABBV,COST,PEP,CRM,BAC,KO,TMO,MCD,CSCO,ACN,NFLX,AMD,ABT,LIN,QCOM,INTC,DIS,IBM,CAT,GE,MMM,HON,BA,SPY,QQQ,DIA,NKE,AXP,GS,PFE,T,VZ,WFC,C,XOM,CVX,MDT,PM';

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    let targetSymbols = indianSymbols;
    if (region === 'global') targetSymbols = globalSymbols;
    else if (region === 'nifty50') targetSymbols = nifty50Symbols;

    try {
      const response = await fetch(`http://127.0.0.1:8000/stocks/batch?symbols=${encodeURIComponent(targetSymbols)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    const interval = setInterval(fetchStocks, 60000);
    return () => clearInterval(interval);
  }, [region]);

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stockData;
    return stockData.filter(stock =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.company_name && stock.company_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [stockData, searchQuery]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pt-28 md:pt-32">

      <div className="max-w-7xl mx-auto flex flex-col gap-8 mt-4">

        {/* === Header Bar === */}
        <div className="flex justify-center items-center py-2">
          <div className="flex items-center gap-4">
            {/* Glassmorphism Segmented Control */}
            <div className="flex bg-gray-950/40 backdrop-blur-md border border-gray-800/50 rounded-2xl p-1.5 shadow-2xl h-fit">
              {[
                { id: 'india', label: 'India 100' },
                { id: 'nifty50', label: 'Nifty 50' },
                { id: 'global', label: 'Global 60' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRegion(tab.id)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 ${region === tab.id
                    ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.05] z-10'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Premium Refresh Button */}
            <button
              onClick={fetchStocks}
              disabled={loading}
              className="group px-6 py-2.5 bg-gray-950/40 backdrop-blur-md border border-gray-800/50 text-gray-400 hover:text-blue-400 hover:border-blue-500/30 rounded-2xl transition-all duration-300 shadow-xl disabled:opacity-50 relative overflow-hidden flex items-center gap-3"
              title="Refresh Market Data"
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <FiRefreshCw className={`w-4 h-4 relative z-10 ${loading ? "animate-spin text-blue-500" : "group-hover:rotate-180 transition-transform duration-300"}`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Refresh</span>
            </button>

            {/* Search Bar */}
            <div className="relative group ml-auto md:ml-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-950/40 backdrop-blur-md border-2 border-blue-600/50 text-white text-sm rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all w-full md:w-64 placeholder-gray-500 shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex flex-col">

          {/* Table Header Row */}
          <div className="hidden md:flex flex-row items-center justify-between px-4 py-4 border-b border-gray-800 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            <div className="w-[30%] shrink-0 flex items-center gap-1 cursor-pointer hover:text-gray-300">COMPANY ▼</div>
            <div className="w-[15%] text-center shrink-0 pr-4"></div>
            <div className="w-[15%] text-left shrink-0 cursor-pointer hover:text-gray-300">MARKET PRICE</div>
            <div className="w-[15%] text-left shrink-0 flex items-center gap-1 cursor-pointer hover:text-gray-300">CLOSE PRICE ▼</div>
            <div className="w-[15%] text-left shrink-0 flex items-center gap-1 cursor-pointer hover:text-gray-300">MARKET CAP (Cr) ▼</div>
            <div className="w-[10%] shrink-0"></div>
          </div>

          {/* Status / Check */}
          {loading && stockData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-gray-400 border border-gray-800 rounded-xl bg-gray-900/10">
              <FiRefreshCw className="animate-spin text-4xl mb-4 text-blue-500" />
              <p>Loading market screener...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center mt-4">
              <p className="text-red-400 font-medium mb-2">{error}</p>
              <button onClick={fetchStocks} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-md transition-colors text-sm">Retry Connection</button>
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="py-20 text-center text-gray-500 border border-gray-800 rounded-xl bg-gray-900/10 mt-2">
              <p className="text-xl font-medium mb-2">No stocks found matching "{searchQuery}".</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredStocks.map((stock) => (
                <StockTableRow key={stock.symbol} {...stock} />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}