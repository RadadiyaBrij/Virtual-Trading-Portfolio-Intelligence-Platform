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
               <div className="mb-20 mt-12 flex flex-col items-center text-center">
                  
                  <h1 className="text-6xl md:text-8xl font-black font-serif tracking-tighter mb-6 text-transparent bg-clip-text bg-linear-to-b from-white via-gray-200 to-gray-500 drop-shadow-2xl">
                     Welcome
                  </h1>
                  
                  <p className="text-gray-400 text-lg md:text-2xl max-w-2xl font-light leading-relaxed">
                     Buy, sell, and track your favorite stocks easily using our <span className="text-white font-medium">high-frequency</span> intelligence terminal.
                  </p>
               </div>

               {/* --- Stack Up Tower --- */}
               <div className="relative py-10 max-w-4xl mx-auto mt-16">
                  {/* Center Vertical Line */}
                  <div className="absolute top-10 bottom-10 left-1/2 -translate-x-1/2 w-1 bg-gray-800/80 rounded-full hidden md:block" />
                  
                  {/* Mobile Vertical Line */}
                  <div className="absolute top-10 bottom-10 left-[35px] w-1 bg-gray-800/80 rounded-full md:hidden" />

                  <div className="flex flex-col gap-12 relative z-10">
                     {[
                        { to: "/market/stocks", icon: <FiSearch size={24} />, label: "Find Stocks", description: "Search and explore stocks to buy.", colors: { border: "group-hover:border-blue-500", text: "group-hover:text-blue-400", bg: "group-hover:bg-blue-500/10", line: "group-hover:bg-blue-500" } },
                        { to: "/portfolio", icon: <FiPieChart size={24} />, label: "My Portfolio", description: "View your current stocks, balance, and past trades.", colors: { border: "group-hover:border-purple-500", text: "group-hover:text-purple-400", bg: "group-hover:bg-purple-500/10", line: "group-hover:bg-purple-500" } },
                        { to: "/news", icon: <FiGlobe size={24} />, label: "News", description: "Read the latest news about the stock market.", colors: { border: "group-hover:border-green-500", text: "group-hover:text-green-400", bg: "group-hover:bg-green-500/10", line: "group-hover:bg-green-500" } },
                        { to: "/market/stocks", icon: <FiTrendingUp size={24} />, label: "Stock Details", description: "Look at charts, prices, and company info before you buy.", colors: { border: "group-hover:border-orange-500", text: "group-hover:text-orange-400", bg: "group-hover:bg-orange-500/10", line: "group-hover:bg-orange-500" } }
                     ].map((item, index) => {
                        const isLeft = index % 2 === 0;
                        
                        return (
                           <Link key={index} to={item.to} className={`group relative flex flex-col md:flex-row items-center w-full cursor-pointer gap-6 md:gap-0 ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                              
                              {/* Left/Right Container (Card) */}
                              <div className={`w-full md:w-1/2 flex pl-20 md:pl-0 ${isLeft ? 'md:pr-12 md:justify-end' : 'md:pl-12 md:justify-start'}`}>
                                 <div className={`opacity-80 group-hover:opacity-100 transition-all duration-500 bg-gray-900/30 backdrop-blur-md border border-transparent group-hover:border-gray-600/50 px-6 py-4 rounded-2xl w-full max-w-sm group-hover:bg-gray-800/60 group-hover:shadow-2xl ${isLeft ? 'group-hover:-translate-x-4 md:text-right' : 'group-hover:translate-x-4 md:text-left'}`}>
                                    <h3 className={`text-2xl font-bold mb-1 text-gray-300 transition-colors duration-300 ${item.colors.text}`}>{item.label}</h3>
                                    
                                    {/* Animated Underline */}
                                    <div className={`h-0.5 w-0 ${item.colors.line} transition-all duration-500 group-hover:w-16 mb-2 ${isLeft ? 'ml-auto' : ''}`} />
                                    
                                    <p className="text-gray-500 text-sm group-hover:text-gray-300 transition-colors duration-300">{item.description}</p>
                                 </div>
                              </div>

                              {/* Center Point */}
                              <div className={`absolute left-[35px] md:static md:left-auto md:-mx-9 w-[72px] h-[72px] rounded-2xl bg-gray-900 border-2 border-gray-700 flex items-center justify-center text-gray-500 transition-all duration-300 shadow-xl z-20 shrink-0 ${item.colors.border} ${item.colors.text} ${item.colors.bg} group-hover:scale-110 group-hover:rotate-3`}>
                                 {item.icon}
                              </div>

                              {/* Empty spacer for opposite side on desktop */}
                              <div className="hidden md:block w-1/2" />
                              
                           </Link>
                        );
                     })}
                  </div>
               </div>

            </div>
         </div>
      </div>
   );
}
