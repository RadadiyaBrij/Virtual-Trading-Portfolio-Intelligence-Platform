import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiStar } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const StockCard = ({ symbol, name, price, change, changePercent, volume, isLoss }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/stocks/${symbol}`)}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 hover:border-gray-700 group cursor-pointer relative overflow-hidden"
    >
      {/* Subtle Background Glow behind text */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{symbol}</h3>
          <p className="text-sm text-gray-400">{name}</p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Handle fave
          }}
          className="text-gray-500 hover:text-yellow-500 transition-colors"
        >
          <FiStar className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex justify-between items-end mt-6 relative z-10">
        <div>
          <div className="text-2xl font-bold text-white tracking-tight">${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className={`flex items-center text-sm font-semibold mt-1 ${isLoss ? 'text-red-500' : 'text-green-500'}`}>
            {isLoss ? <FiTrendingDown className="mr-1 animate-pulse " /> : <FiTrendingUp className="mr-1 animate-pulse" />}
            <span>{isLoss ? '' : '+'}{change.toFixed(2)} ({isLoss ? '' : '+'}{changePercent}%)</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Vol</div>
          <div className="text-sm font-medium text-gray-300">{volume}</div>
        </div>
      </div>
    </div>
  );
};

export default StockCard;
