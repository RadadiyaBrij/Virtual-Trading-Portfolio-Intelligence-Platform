import React from 'react';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiSearch, FiGlobe, FiPieChart } from 'react-icons/fi';

export default function Dashboard() {
   return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
         {/* Background Image with Opacity */}
         <div
            className="absolute inset-0 z-0 opacity-25"
            style={{
               backgroundImage: "url('/dynamic-data-visualization-3d.jpg')",
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundAttachment: 'fixed'
            }}
         />

         <div className="relative z-10 p-6 md:p-12 pt-28 md:pt-36 h-full">
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom duration-700">

               {/* --- Hero Header --- */}
               <div className="mb-12 mt-10">
                  <h1 className="text-5xl md:text-5xl font-bold font-serif tracking-tighter mb-6 text-transparent bg-clip-text bg-linear-to-r from-white to-gray-400">Welcome</h1>
                  <p className="text-gray-300 text-xl max-w-2xl font-medium drop-shadow-md">Buy, sell, and track your favorite stocks easily.</p>
               </div>

               {/* --- Quick Access Grid --- */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  <DashboardCard
                     to="/market/stocks"
                     icon={<FiSearch className="text-blue-500" />}
                     label="Find Stocks"
                     description="Search and explore stocks to buy."
                  />
                  <DashboardCard
                     to="/portfolio"
                     icon={<FiPieChart className="text-purple-500" />}
                     label="My Portfolio"
                     description="View your current stocks, balance, and past trades."
                  />
                  <DashboardCard
                     to="/news"
                     icon={<FiGlobe className="text-green-500" />}
                     label="News"
                     description="Read the latest news about the stock market."
                  />
                  <DashboardCard
                     to="/market/stocks"
                     icon={<FiTrendingUp className="text-orange-500" />}
                     label="Stock Details"
                     description="Look at charts, prices, and company info before you buy."
                  />
               </div>

            </div>
         </div>
      </div>
   );
}

function DashboardCard({ to, icon, label, description }) {
   return (
      <Link to={to} className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 p-8 rounded-3xl flex flex-col gap-6 hover:bg-gray-800/80 hover:border-gray-500 transition-all group shadow-2xl relative overflow-hidden">
         {/* Card Glow Effect */}
         <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all" />

         <div className="text-4xl bg-black/50 border border-gray-700/50 w-16 h-16 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 shadow-inner z-10">
            {icon}
         </div>
         <div className="z-10">
            <h3 className="text-xl font-bold mb-2 group-hover:text-white text-gray-200 transition-colors">{label}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
         </div>
      </Link>
   );
}
