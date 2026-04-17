import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiTrendingUp, FiTrendingDown, FiPieChart, FiDollarSign } from 'react-icons/fi';

export default function Portfolio() {
  const [profile, setProfile] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Please login to see your portfolio.");
      setLoading(false);
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${session.access_token}` };
      
      const profileRes = await fetch('http://127.0.0.1:8000/auth/profile', { headers });
      const profileData = await profileRes.json();
      setProfile(profileData);

      const portfolioRes = await fetch('http://127.0.0.1:8000/portfolio', { headers });
      const portfolioData = await portfolioRes.json();
      setHoldings(portfolioData);
    } catch (err) {
      setError("Failed to fetch portfolio data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const totalValue = holdings.reduce((acc, curr) => acc + curr.value, 0);
  const totalProfit = holdings.reduce((acc, curr) => acc + curr.profit, 0);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-gray-500 font-medium">Loading portfolio...</div>;
  if (error) return <div className="min-h-screen bg-black flex items-center justify-center text-red-400">{error}</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 tracking-tight">My Portfolio</h1>
        
        {/* === Stats Grid === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-950/40 border border-blue-800 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><FiDollarSign /></div>
              <span className="uppercase text-[10px] font-black tracking-widest">Available Cash</span>
            </div>
            <div className="text-3xl font-bold tracking-tight">₹{profile?.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          
          <div className="bg-gray-950/40 border border-blue-800 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><FiPieChart /></div>
              <span className="uppercase text-[10px] font-black tracking-widest">Invested Value</span>
            </div>
            <div className="text-3xl font-bold tracking-tight">₹{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          
          <div className="bg-gray-950/40 border border-blue-800 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-gray-400 mb-2">
              <div className={`p-2 rounded-lg ${totalProfit >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {totalProfit >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
              </div>
              <span className="uppercase text-[10px] font-black tracking-widest">Net Profit/Loss</span>
            </div>
            <div className={`text-3xl font-bold tracking-tight ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* === Holdings Table === */}
        <div className="bg-gray-950/40 border border-blue-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-blue-800">
            <h2 className="text-xl font-bold text-gray-200">Current Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white/2 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Quantity</th>
                  <th className="px-6 py-4">Avg Price</th>
                  <th className="px-6 py-4">Current Price</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">P/L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {holdings.map((h) => (
                  <tr key={h.symbol} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-5 font-bold text-gray-200">{h.symbol}</td>
                    <td className="px-6 py-5 text-gray-300">{h.quantity}</td>
                    <td className="px-6 py-5 text-gray-300">₹{h.avgPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-gray-300">₹{h.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 font-bold text-gray-200">₹{h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className={`px-6 py-5 font-bold ${h.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {h.profit >= 0 ? '+' : ''}₹{h.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {holdings.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-gray-500">Your portfolio is currently empty. Start trading to see holdings.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
