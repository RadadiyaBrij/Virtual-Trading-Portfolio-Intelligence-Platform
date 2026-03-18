import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import StockCard from '../components/market/StockCard';

export default function Stocks() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default symbols to track
  const defaultSymbols = 'AAPL,TSLA,MSFT,NVDA,AMZN,META,GOOGL,AMD,NFLX,INTC,SPY,QQQ';

  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/stocks/batch?symbols=${defaultSymbols}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the backend. check it\'s running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    
    // Auto-refresh every 60 seconds (optional)
    const interval = setInterval(fetchStocks, 60000);
    return () => clearInterval(interval);
  }, []);

  return(
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-linear-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">Market Overview</h1>
            <p className="text-gray-400">Track and analyze real-time market movements</p>
          </div>
          
          <div className="mt-6 md:mt-0 flex gap-4 w-full md:w-auto items-center">
            <button 
              onClick={fetchStocks}
              disabled={loading}
              className="p-3 bg-gray-900 border border-gray-800 text-gray-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              title="Refresh Market Data"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
            <div className="relative w-full md:w-72">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search company..." 
                className="w-full bg-gray-900 border border-gray-800 text-white rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Filters/Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <button className="bg-blue-600 px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-lg shadow-blue-500/20">All Stocks</button>
          <button className="bg-gray-900 border border-gray-800 hover:bg-gray-800 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-300 transition-colors whitespace-nowrap">Top Gainers</button>
          <button className="bg-gray-900 border border-gray-800 hover:bg-gray-800 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-300 transition-colors whitespace-nowrap">Top Losers</button>
          <button className="bg-gray-900 border border-gray-800 hover:bg-gray-800 px-6 py-2.5 rounded-full text-sm font-semibold text-gray-300 transition-colors whitespace-nowrap flex items-center">
            <FiFilter className="mr-2" />
            Filters
          </button>
        </div>

        {/* Status / Grid */}
        {loading && stockData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FiRefreshCw className="animate-spin text-4xl mb-4 text-blue-500" />
            <p>Fetching real-time market data...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 text-center">
            <p className="text-red-400 font-medium mb-2">{error}</p>
            <button onClick={fetchStocks} className="bg-red-500/20 hover:bg-red-500/40 text-red-300 px-4 py-2 rounded-md transition-colors text-sm">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {stockData.map((stock) => (
              <StockCard key={stock.symbol} {...stock} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}