import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiSearch, FiGlobe, FiPieChart } from 'react-icons/fi';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">
        
        {/* --- Hero Header --- */}
        <div className="mb-12">
           <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4">Welcome</h1>
           <p className="text-gray-400 text-lg max-w-2xl font-medium">Manage your virtual equity portfolio and track global market insights.</p>
        </div>

        {/* --- Quick Access Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
           <DashboardCard 
              to="/market/stocks" 
              icon={<FiSearch className="text-blue-500" />} 
              label="Stock Screener" 
              description="Identify top-performing stocks across India and Global markets."
           />
           <DashboardCard 
              to="/portfolio" 
              icon={<FiPieChart className="text-purple-500" />} 
              label="My Portfolio" 
              description="Monitor your holdings and verify transaction history."
           />
           <DashboardCard 
              to="/news" 
              icon={<FiGlobe className="text-green-500" />} 
              label="Market News" 
              description="Stay ahead with real-time financial news and global updates."
           />
           <DashboardCard 
              to="/market/stocks" 
              icon={<FiTrendingUp className="text-orange-500" />} 
              label="Stock Analysis" 
              description="Dive deep into company fundamentals and financial ratios."
           />
        </div>

      </div>
    </div>
  );
}

function DashboardCard({ to, icon, label, description }) {
  return (
    <Link to={to} className="bg-gray-900/50 border border-gray-800 p-8 rounded-2xl flex flex-col gap-6 hover:bg-gray-800 hover:border-gray-700 transition-all group shadow-2xl">
       <div className="text-4xl bg-black border border-gray-800 w-16 h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
          {icon}
       </div>
       <div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{label}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
       </div>
    </Link>
  );
}
