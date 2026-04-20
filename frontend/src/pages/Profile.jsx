import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FiUser, FiSave, FiDollarSign, FiActivity, FiPieChart, FiTrendingUp } from 'react-icons/fi';

export default function Profile() {
  const [session, setSession] = useState(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({
    balance: 0,
    realizedProfit: 0,
    unrealizedProfit: 0,
    totalTrades: 0
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUsername(session.user.user_metadata?.username || session.user.email.split('@')[0]);
        fetchStats(session.access_token);
      }
    });
  }, []);

  const fetchStats = async (token) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [profileRes, portfolioRes, txRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/auth/profile', { headers }),
        fetch('http://127.0.0.1:8000/portfolio', { headers }),
        fetch('http://127.0.0.1:8000/transactions', { headers })
      ]);

      const profileData = await profileRes.json();
      const portfolioData = await portfolioRes.json();
      const txData = await txRes.json();

      const rProfit = txData.reduce((acc, tx) => acc + (tx.profit_loss_inr || 0), 0);
      const uProfit = portfolioData.reduce((acc, h) => acc + (h.profit || 0), 0);

      setStats({
        balance: profileData.balance || 0,
        realizedProfit: rProfit,
        unrealizedProfit: uProfit,
        totalTrades: txData.length
      });
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { data, error } = await supabase.auth.updateUser({
      data: { username: username }
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Profile updated successfully!');
      supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    }
    setLoading(false);
  };

  if (!session) return <div className="min-h-screen bg-black text-white flex items-center justify-center pt-28">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10 pt-28 md:pt-32">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 tracking-tight flex items-center gap-3">
          <FiUser className="text-blue-500" /> My Profile
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Stats Column */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 backdrop-blur-md shadow-2xl">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Account Stats</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <FiDollarSign className="text-blue-400" />
                    <span className="text-gray-400 text-sm">Available Cash</span>
                  </div>
                  <span className="font-bold">₹{stats.balance.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <FiTrendingUp className={stats.realizedProfit >= 0 ? "text-green-400" : "text-red-400"} />
                    <span className="text-gray-400 text-sm">Realized P/L</span>
                  </div>
                  <span className={`font-bold ${stats.realizedProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {stats.realizedProfit >= 0 ? '+' : ''}₹{stats.realizedProfit.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <FiPieChart className={stats.unrealizedProfit >= 0 ? "text-green-400" : "text-red-400"} />
                    <span className="text-gray-400 text-sm">Unrealized P/L</span>
                  </div>
                  <span className={`font-bold ${stats.unrealizedProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {stats.unrealizedProfit >= 0 ? '+' : ''}₹{stats.unrealizedProfit.toLocaleString('en-IN', {maximumFractionDigits: 2})}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <FiActivity className="text-purple-400" />
                    <span className="text-gray-400 text-sm">Total Trades</span>
                  </div>
                  <span className="font-bold">{stats.totalTrades}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Settings Column */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
          <div className="mb-6">
            <label className="block text-gray-400 text-sm font-bold mb-2">Email Address</label>
            <input 
              type="text" 
              value={session.user.email} 
              disabled 
              className="w-full bg-black/50 border border-gray-800 text-gray-500 rounded-xl px-4 py-3 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 mt-2">Email cannot be changed.</p>
          </div>
          
          <form onSubmit={handleUpdate}>
            <div className="mb-8">
              <label className="block text-gray-300 text-sm font-bold mb-2">Display Name</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-950/40 border-2 border-blue-600/30 focus:border-blue-500 text-white rounded-xl px-4 py-3 focus:outline-none transition-colors shadow-inner"
                placeholder="Enter your username"
                required
              />
            </div>
            
            {message && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${message.includes('Error') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                {message}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:opacity-50"
            >
              <FiSave /> {loading ? 'Saving Profile...' : 'Save Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
