import React from 'react';
import Navbar from '../components/navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar />
      
      <main className="max-w-7xl mx-auto p-8">
        <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portfolio Card */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg text-gray-500 font-medium mb-2">Portfolio Value</h3>
            <p className="text-3xl font-bold text-gray-800">$10,000.00</p>
          </div>
          
          {/* Market Status Card */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg text-gray-500 font-medium mb-2">Market Status</h3>
            <p className="text-3xl font-bold text-green-500">Open</p>
          </div>
          
          {/* News Sentiment Card */}
          <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg text-gray-500 font-medium mb-2">Tesla Sentiment</h3>
            <p className="text-3xl font-bold text-blue-500">+0.62 (Positive)</p>
          </div>
        </div>
        
        {/* Placeholder for Chart */}
        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100 h-96 flex items-center justify-center">
          <p className="text-gray-400 font-medium text-lg">Chart / Graph placeholder</p>
        </div>
      </main>
    </div>
  );
}
