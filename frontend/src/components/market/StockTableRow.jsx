import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp, FiTrendingDown, FiBarChart2 } from 'react-icons/fi';

const StockTableRow = ({ symbol, name, price, change, changePercent, formattedMarketCap, previousClose, isLoss, sparkline }) => {
  const navigate = useNavigate();

  const normalizedSparkline = () => {
    if (!sparkline || sparkline.length === 0) return null;
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const range = max - min || 1;

    return sparkline.map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * 100;
      const y = 30 - (((val - min) / range) * 30);
      return `${x},${y}`;
    }).join(' ');
  };

  const strokeColor = isLoss ? '#ef4444' : '#10b981';

  const cleanSymbol = symbol.replace('.NS', '').replace('.BO', '');
  const initials = cleanSymbol.substring(0, 2).toUpperCase();

  return (
    <div
      onClick={() => navigate(`/stocks/${symbol}`)}
      className="flex flex-col md:flex-row items-center justify-between p-4 mb-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-800/80 rounded-xl transition-all cursor-pointer group"
    >

      {/* Company Logo & Name */}
      <div className="flex items-center w-full md:w-[30%] mb-4 md:mb-5">
        <div className="w-20 h-20 rounded-full bg-blue-900/40 border border-blue-900/30 text-blue-200 text-2xl font-bold flex items-center justify-center mr-10 shadow-blue-400 ">
          {initials}
        </div>
        <div className="flex flex-col min-w-20">
          <span className="font-bold text-gray-100 truncate w-20 group-hover:text-blue-400 transition-colors">{name}</span>
          <span className="text-md text-gray-500 font-medium">{symbol}</span>
        </div>
      </div>

      {/* Sparkline Graph */}
      <div className="w-full md:w-[15%] hidden md:flex items-center justify-center pr-4">
        {sparkline && sparkline.length > 0 ? (
          <svg width="100" height="50" viewBox="0 0 100 30" className="opacity-100">
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={normalizedSparkline()}
            />
          </svg>
        ) : (
          <div className="w-24 h-0.5 bg-gray-800 rounded-full"></div>
        )}
      </div>

      {/*  Market Price and Change */}
      <div className="w-full md:w-[15%] flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start text-sm md:text-md mb-2 md:mb-0">
        <span className="font-bold tracking-wide text-gray-200">₹{price ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
        <div className={`text-md font-semibold mt-0.5 ${isLoss ? 'text-red-500' : 'text-green-500'}`}>
          {isLoss ? '' : '+'}{change ? change.toFixed(2) : '0.00'} ({isLoss ? '' : '+'}{changePercent ? changePercent.toFixed(2) : '0.00'}%)
        </div>
      </div>

      {/* Close Price */}
      <div className="w-full md:w-[15%] flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start text-md mb-2 md:mb-0 text-gray-400 font-medium">
        <span className="md:hidden">Close Price</span>
        <span>₹{previousClose ? previousClose.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
      </div>

      {/* Market Cap */}
      <div className="w-full md:w-[15%] flex flex-row md:flex-col justify-between md:justify-center items-center md:items-start text-md mb-4 md:mb-0 text-gray-300 font-medium">
        <span className="md:hidden">Market Cap</span>
        <span>₹{formattedMarketCap || '0'}</span>
      </div>

      <div className="w-full md:w-[15%] flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/stocks/${symbol}/analysis`);
          }}
          className="px-4 py-2 bg-blue-500/10 hover:bg-emerald-500/20 border border-blue-500/20 hover:border-emerald-500/50 text-blue-400 hover:text-emerald-400 rounded-lg text-xs font-bold transition-all flex items-center gap-2 group/btn shadow-inner hover:shadow-emerald-500/10 cursor-pointer"
        >
          <FiBarChart2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
          <span className="tracking-wide">ANALYZE</span>
        </button>
      </div>

    </div>
  );
};

export default StockTableRow;
