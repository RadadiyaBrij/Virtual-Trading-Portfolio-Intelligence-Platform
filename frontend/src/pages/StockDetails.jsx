import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiGlobe, FiMapPin, FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function StockDetails() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  
  const [timeRange, setTimeRange] = useState('1M');
  const [chartData, setChartData] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeMessage, setTradeMessage] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`http://127.0.0.1:8000/stocks/${symbol}`);
        if (!response.ok) throw new Error('Failed to fetch details');
        const data = await response.json();
        setStock(data);
      } catch (err) {
        setError('Error fetching stock information. Is the backend running?');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [symbol]);

  useEffect(() => {
    const fetchChart = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/stocks/${symbol}/chart?range=${timeRange}`);
        if (response.ok) {
          const data = await response.json();
          setChartData(data);
        }
      } catch (err) {
        console.error("Failed to fetch chart", err);
      }
    };
    fetchChart();
  }, [symbol, timeRange]);

  const handleTrade = async (action) => {
    if (!session) {
      navigate('/login');
      return;
    }

    setTradeLoading(true);
    setTradeMessage(null);
    try {
      const response = await fetch(`http://127.0.0.1:8000/trade/${action.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          symbol: symbol,
          quantity: quantity,
          price: stock.price
        })
      });

      const result = await response.json();
      if (response.ok) {
        setTradeMessage({ type: 'success', text: `Successfully ${action === 'BUY' ? 'bought' : 'sold'} ${quantity} shares!` });
        setTimeout(() => setTradeMessage(null), 3000);
      } else {
        setTradeMessage({ type: 'error', text: result.detail || 'Trade failed.' });
      }
    } catch (err) {
      setTradeMessage({ type: 'error', text: 'Network error. Could not execute trade.' });
    } finally {
      setTradeLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  if (error || !stock) return (
    <div className="min-h-screen bg-black text-white p-10 text-center">
      <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <p className="text-red-500 text-xl font-bold mb-4">{error || 'Stock not found'}</p>
        <Link to="/market/stocks" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg transition-colors">
          Back to Market
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <Link to="/market/stocks" className="inline-flex items-center text-gray-400 hover:text-white mb-10 transition-colors group">
          <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Market
        </Link>

        {/* Header section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-8">
          <div className="animate-in fade-in slide-in-from-left duration-700 flex-1">
            <div className="flex flex-wrap items-end gap-5 mb-5">
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                {stock.symbol.replace('.NS', '').replace('.BO', '')}
              </h1>
              <div className="h-10 w-px bg-white/10 hidden md:block mb-2"></div>
              <span className="text-lg md:text-xl text-gray-400 font-medium tracking-wide mb-2 max-w-[50%] truncate">
                {stock.name}
              </span>
            </div>
            
            <div className="flex flex-wrap items-baseline gap-6">
              <span className="text-5xl font-black tracking-tight text-white drop-shadow-md">
                ₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <div className={`px-4 py-2 rounded-xl flex items-center shadow-lg backdrop-blur-sm ${stock.isLoss ? 'bg-red-500/10 border border-red-500/20 text-red-500' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'}`}>
                {stock.isLoss ? <FiTrendingDown className="mr-2 w-5 h-5" /> : <FiTrendingUp className="mr-2 w-5 h-5" />}
                <span className="text-xl font-bold tracking-tight">
                  {stock.isLoss ? '' : '+'}{stock.change.toFixed(2)} ({stock.isLoss ? '' : '+'}{stock.changePercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* === Trading Widget === */}
          <div className="w-full lg:w-[420px] bg-gray-950/40 backdrop-blur-xl border border-gray-800/60 rounded-3xl p-7 shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right duration-700 shrink-0">
             <div className="flex items-center justify-between gap-6 mb-8">
                <div className="flex items-center bg-black/60 border border-white/5 rounded-2xl p-1.5 shadow-inner">
                   <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-gray-500 hover:text-blue-400 transition-colors rounded-xl hover:bg-white/5"><FiMinus className="w-5 h-5"/></button>
                   <input 
                      type="number" 
                      className="w-16 bg-transparent text-center font-black text-white text-xl focus:outline-none" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                   />
                   <button onClick={() => setQuantity(quantity + 1)} className="p-3 text-gray-500 hover:text-blue-400 transition-colors rounded-xl hover:bg-white/5"><FiPlus className="w-5 h-5"/></button>
                </div>
                <div className="text-right flex flex-col justify-center">
                   <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Total Value</p>
                   <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-300">
                     ₹{(quantity * stock.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                   </p>
                </div>
             </div>

             <div className="flex gap-4 mb-4">
                <button 
                   onClick={() => handleTrade('BUY')}
                   disabled={tradeLoading}
                   className="flex-1 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 border border-emerald-500/20 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50"
                >
                   {tradeLoading ? 'Processing...' : 'Buy Shares'}
                </button>
                <button 
                   onClick={() => handleTrade('SELL')}
                   disabled={tradeLoading}
                   className="flex-1 bg-gray-800/80 hover:bg-gray-700 border border-white/5 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                   {tradeLoading ? 'Processing...' : 'Sell Shares'}
                </button>
             </div>

             {tradeMessage && (
                <div className={`text-xs text-center font-bold p-2 rounded-lg ${tradeMessage.type === 'success' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                   {tradeMessage.text}
                </div>
             )}
             
             {!session && (
                <p className="text-[10px] text-gray-500 text-center mt-2">Sign in to begin virtual trading.</p>
             )}
          </div>
        </div>

        {/* ... Rest of the UI remains consistent (Chart, Stats, Summary) ... */}
        <div className="flex gap-4 mb-12">
           <Link to={`/stocks/${symbol}/analysis`} className="flex-1 group relative overflow-hidden bg-gray-950/50 backdrop-blur-xl border border-purple-500/30 hover:border-purple-500/60 rounded-[2rem] p-1 transition-all duration-500 shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:shadow-[0_0_60px_rgba(168,85,247,0.3)]">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-purple-600/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000 bg-[length:200%_100%] animate-gradient-x" />
              <div className="relative flex items-center justify-center gap-4 bg-black/40 px-8 py-5 rounded-[1.75rem]">
                 <div className="bg-purple-500/20 p-2.5 rounded-xl border border-purple-500/30">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-300 block">🧠</span>
                 </div>
                 <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 mb-0.5">Proprietary Engine</span>
                    <span className="text-lg font-bold text-gray-100 group-hover:text-white transition-colors tracking-wide">Strategic Intelligence Analysis</span>
                 </div>
              </div>
           </Link>
        </div>

        {/* Chart Area */}
        <div className="bg-gray-950/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl mb-12 shadow-2xl">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                 <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">Market Price Action</h2>
              </div>
              <div className="flex bg-black/60 border border-white/5 rounded-xl p-1.5 shadow-inner">
                {['1D', '1W', '1M', '1Y'].map((range) => (
                   <button 
                      key={range} 
                      onClick={() => setTimeRange(range)} 
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                        timeRange === range 
                          ? 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' 
                          : 'text-gray-500 hover:text-white hover:bg-white/5'
                      }`}
                   >
                     {range}
                   </button>
                ))}
              </div>
           </div>
           
           <div className="h-80 w-full">
              {chartData.length > 0 ? (
                <Line 
                  data={{
                    labels: chartData.map(d => d.time),
                    datasets: [{
                      label: 'Price',
                      data: chartData.map(d => d.price),
                      borderColor: stock.isLoss && timeRange === '1D' ? '#ef4444' : '#3b82f6',
                      backgroundColor: stock.isLoss && timeRange === '1D' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      borderWidth: 2, pointRadius: 0, fill: true, tension: 0.1
                    }]
                  }}
                  options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: '#6b7280', maxTicksLimit: 7 } },
                      y: { grid: { color: '#374151', borderDash: [3, 3] }, ticks: { color: '#6b7280', callback: v => '₹' + v } }
                    }
                  }}
                />
              ) : <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium">Loading history...</div>}
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-gray-950/40 border border-white/5 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xl font-black mb-8 flex items-center text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-4 shadow-[0_0_10px_rgba(37,99,235,0.5)]"></span> 
              FAST STATS
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-6">
              <StatItem label="Market Cap" value={stock.marketCap} />
              <StatItem label="Volume" value={stock.volume} />
              <StatItem label="Revenue" value={stock.totalRevenue} />
              <StatItem label="Net Income" value={stock.netIncome} />
              <StatItem label="PE Ratio" value={stock.trailingPE} />
              <StatItem label="52W High" value={`₹${stock.fiftyTwoWeekHigh}`} />
            </div>
          </div>

          <div className="bg-gray-950/40 border border-white/5 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl">
             <h2 className="text-xl font-black mb-8 flex items-center text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-4 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span> 
                PROFILE
             </h2>
             <div className="space-y-8">
                <ProfileItem icon={<FiGlobe />} label="Website" value={stock.website} isLink />
                <ProfileItem icon={<FiMapPin />} label="Region" value={`${stock.city}, ${stock.country}`} />
             </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-950/40 border border-white/5 rounded-3xl p-8 md:p-10 mb-20 backdrop-blur-xl shadow-2xl">
           <h2 className="text-xl font-black mb-6 text-gray-200">Operations & Business</h2>
           <p className="text-gray-400 leading-loose text-sm text-justify line-clamp-6 hover:line-clamp-none transition-all duration-1000">
             {stock.description}
           </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em]">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-gray-100 tracking-tight">{value}</p>
    </div>
  );
}

function ProfileItem({ icon, label, value, isLink }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
       <div className="mt-1 flex items-center justify-center p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
         {icon}
       </div>
       <div className="flex flex-col gap-1">
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em]">{label}</p>
          {isLink ? (
            <a href={value} className="text-blue-400 hover:text-blue-300 font-bold text-sm break-all transition-colors">
              {value.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <p className="text-gray-200 text-sm font-bold tracking-wide">{value}</p>
          )}
       </div>
    </div>
  );
}
