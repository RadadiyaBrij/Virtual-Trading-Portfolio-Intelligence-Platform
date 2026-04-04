import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiTrendingUp, FiTrendingDown, FiGlobe, FiMapPin, FiUsers } from 'react-icons/fi';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

export default function StockDetails() {
  const { symbol } = useParams();
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [timeRange, setTimeRange] = useState('1M');
  const [chartData, setChartData] = useState([]);

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">{stock.symbol.replace('.NS', '').replace('.BO', '')}</h1>
              <div className="h-10 w-px bg-gray-800 hidden md:block"></div>
              <span className="text-xl md:text-2xl text-gray-400 font-medium">{stock.name}</span>
            </div>
            <div className="flex items-baseline gap-6">
              <span className="text-4xl font-bold tracking-tight">₹{stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span className={`text-2xl font-bold flex items-center ${stock.isLoss ? 'text-red-500' : 'text-green-500'}`}>
                {stock.isLoss ? <FiTrendingDown className="mr-2" /> : <FiTrendingUp className="mr-2" />}
                {stock.isLoss ? '' : '+'}{stock.change.toFixed(2)} ({stock.isLoss ? '' : '+'}{stock.changePercent}%)
              </span>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto animate-in fade-in slide-in-from-right duration-700">
             <button className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-95">Buy</button>
             <button className="flex-1 md:flex-none bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all active:scale-95">Sell</button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm mb-12 animate-in fade-in slide-in-from-bottom duration-700">
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-200">Price History</h2>
              <div className="flex bg-gray-900 border border-gray-800 rounded-lg p-1 shadow-inner h-fit">
                {['1D', '1W', '1M', '1Y'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${timeRange === range ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
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
                     borderWidth: 2,
                     pointRadius: 0,
                     pointHoverRadius: 6,
                     fill: true,
                     tension: 0.1
                   }]
                 }}
                 options={{
                   responsive: true,
                   maintainAspectRatio: false,
                   plugins: {
                     legend: { display: false },
                     tooltip: {
                       mode: 'index',
                       intersect: false,
                       backgroundColor: '#111827',
                       titleColor: '#9ca3af',
                       bodyColor: '#60a5fa',
                       borderColor: '#374151',
                       borderWidth: 1,
                     }
                   },
                   scales: {
                     x: {
                       grid: { display: false },
                       ticks: { color: '#6b7280', maxTicksLimit: 7 },
                       border: { display: false }
                     },
                     y: {
                       grid: { color: '#374151', borderDash: [3, 3] },
                       ticks: { color: '#6b7280', callback: value => '₹' + value },
                       border: { display: false }
                     }
                   },
                   interaction: {
                     intersect: false,
                     mode: 'index',
                   },
                 }}
               />
             ) : (
               <div className="h-full w-full flex items-center justify-center text-gray-500 font-medium">
                 {loading ? 'Processing chart...' : 'Loading chart data...'}
               </div>
             )}
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in fade-in zoom-in duration-1000">
          {/* Key Statistics Card */}
          <div className="lg:col-span-2 bg-gray-900/40 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-8 flex items-center">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3"></span>
              Key Statistics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-10 gap-x-8">
              <StatItem label="Market Cap" value={stock.marketCap} />
              <StatItem label="Volume" value={stock.volume} />
              <StatItem label="Div Yield" value={stock.dividendYield === "N/A" ? "N/A" : `${stock.dividendYield}%`} />
              <StatItem label="Trailing PE" value={stock.trailingPE} />
              <StatItem label="Forward PE" value={stock.forwardPE} />
              <StatItem label="52W Range" value={`₹${stock.fiftyTwoWeekLow} - ₹${stock.fiftyTwoWeekHigh}`} />
              <StatItem label="Revenue" value={stock.totalRevenue} />
              <StatItem label="Net Income" value={stock.netIncome} />
              <StatItem label="Employees" value={stock.fullTimeEmployees.toLocaleString()} />
            </div>
          </div>

          {/* Company Info Sidebar */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 backdrop-blur-sm">
             <h2 className="text-2xl font-bold mb-8 flex items-center">
                <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                Profile
             </h2>
             <div className="space-y-8">
                <ProfileItem icon={<FiGlobe />} label="Website" value={stock.website} isLink />
                <ProfileItem icon={<FiMapPin />} label="Headquarters" value={`${stock.city}, ${stock.country}`} />
                <div className="pt-6 border-t border-gray-800">
                    <p className="text-sm text-gray-500 uppercase font-bold tracking-widest mb-2">Sector & Industry</p>
                    <p className="text-gray-200 text-lg font-medium">{stock.sector}</p>
                    <p className="text-gray-400 text-sm mt-1">{stock.industry}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Long Business Summary */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 md:p-12 mb-10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-1000">
          <h2 className="text-3xl font-bold mb-6">About {stock.name}</h2>
          <p className="text-gray-300 leading-relaxed text-lg text-justify whitespace-pre-line">
            {stock.description}
          </p>
        </div>

        {/* Company News from Finnhub */}
        {stock.companyNews && stock.companyNews.length > 0 && (
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 md:p-12 mb-10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom duration-1000" style={{ animationDelay: '200ms' }}>
             <h2 className="text-3xl font-bold mb-6 flex items-center">
                <span className="w-1.5 h-8 bg-green-500 rounded-full mr-3"></span>
                Recent News
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stock.companyNews.map((newsItem, idx) => (
                   <a key={idx} href={newsItem.url} target="_blank" rel="noopener noreferrer" className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl p-5 hover:bg-gray-800 transition-all flex gap-4 group shadow-lg">
                      {newsItem.image && (
                         <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-800 hidden sm:block">
                            <img src={newsItem.image} alt="news" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         </div>
                      )}
                      <div className="flex-1 flex flex-col justify-between">
                         <h3 className="font-bold text-gray-200 group-hover:text-blue-400 line-clamp-2 mb-2">{newsItem.headline}</h3>
                         <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                            <span className="uppercase font-bold text-gray-400">{newsItem.source}</span>
                            <span>{new Date(newsItem.datetime * 1000).toLocaleDateString()}</span>
                         </div>
                      </div>
                   </a>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div>
      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">{label}</p>
      <p className="text-xl font-semibold text-gray-100">{value}</p>
    </div>
  );
}

function ProfileItem({ icon, label, value, isLink }) {
  return (
    <div className="flex items-start gap-4">
       <div className="mt-1 text-blue-500 text-xl">{icon}</div>
       <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">{label}</p>
          {isLink ? (
             <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors break-all font-medium">
               {value.replace(/^https?:\/\//, '')}
             </a>
          ) : (
             <p className="text-gray-200 font-medium">{value}</p>
          )}
       </div>
    </div>
  );
}
