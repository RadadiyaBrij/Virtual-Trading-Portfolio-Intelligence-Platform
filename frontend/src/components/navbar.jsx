import React from 'react';

export default function Navbar() {
  return (
    <nav className="p-4 bg-gray-900 text-white flex justify-between items-center shadow-md">
      <h1 className="text-xl font-bold tracking-wide">TradingIntel</h1>
      <div className="space-x-6">
        <a href="/" className="hover:text-blue-400 transition-colors">Dashboard</a>
        <a href="/portfolio" className="hover:text-blue-400 transition-colors">Portfolio</a>
        <a href="/market" className="hover:text-blue-400 transition-colors">Market</a>
      </div>
    </nav>
  );
}
