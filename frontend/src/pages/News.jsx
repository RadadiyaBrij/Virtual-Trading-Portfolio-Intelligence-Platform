import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiClock, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('india');

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
     
      const response = await fetch(`http://127.0.0.1:8000/news?category=${category}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message || 'Error fetching news from API');
      }
      
      if (Array.isArray(data)) {
        setNews(data);
      } else {
        setNews([]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not connect to the backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [category]);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 mt-8 gap-6">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">Market News</h1>
            <p className="text-gray-500 font-medium">Live breaking updates from the global wire</p>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-wrap gap-4 w-full md:w-auto items-center">
             
             <div className="flex bg-black/60 border border-blue-800 rounded-xl p-1.5 shadow-inner overflow-x-auto scrollbar-hide shrink-0 max-w-full">
                {['india', 'general', 'crypto', 'forex'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${category === cat ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    {cat}
                  </button>
                ))}
             </div>

             <button 
               onClick={fetchNews}
               disabled={loading}
               className="p-3 bg-black/60 border border-blue-800 text-gray-400 hover:text-white rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 px-6 text-[10px] font-black uppercase tracking-[0.2em] shrink-0 active:scale-95"
             >
               <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
             </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-900 rounded-full animate-spin border-t-blue-500"></div>
              <FiRefreshCw className="absolute inset-0 m-auto text-xl animate-spin-reverse opacity-50" />
            </div>
            <p className="font-medium">Loading market news...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-10 text-center max-w-2xl mx-auto mt-10 backdrop-blur-md">
             <FiAlertCircle className="mx-auto text-4xl text-red-500 mb-4" />
            <p className="text-red-400 font-bold mb-6">{error}</p>
            <button onClick={fetchNews} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl transition-all font-black text-xs uppercase tracking-widest active:scale-95">Re-establish Connection</button>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
             <p className="text-xl font-medium tracking-tight">No trending stories available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 animate-in fade-in slide-in-from-bottom duration-1000">
            {news.map((article, index) => (
              <a 
                key={index}
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-gray-950/40 border border-blue-800 rounded-3xl overflow-hidden hover:bg-gray-900 transition-all duration-500 shadow-2xl hover:shadow-blue-500/5 hover:border-blue-700 group flex flex-col h-full active:scale-[0.98]"
              >
                {article.image ? (
                  <div className="h-48 w-full overflow-hidden relative">
                    <div className="absolute inset-0 bg-blue-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                    <img 
                       src={article.image} 
                       alt={article.headline} 
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                    />
                  </div>
                ) : (
                   <div className="h-48 w-full bg-black/60 border-b border-blue-800 flex items-center justify-center">
                     <span className="text-gray-700 text-[10px] font-black uppercase tracking-[0.3em]">No Media</span>
                   </div>
                )}

                <div className="p-8 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-5">
                     <span className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                        {article.source}
                     </span>
                     <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
                        <FiClock className="mr-1.5" /> 
                        {new Date(article.datetime * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-100 mb-4 group-hover:text-white transition-colors line-clamp-2 leading-tight tracking-tight">
                    {article.headline}
                  </h2>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-8 flex-1 leading-relaxed">
                    {article.summary || "No preview available for this market update."}
                  </p>
                  
                  <div className="mt-auto flex items-center text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] group-hover:text-blue-300 transition-colors">
                    READ STORY <FiExternalLink className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
