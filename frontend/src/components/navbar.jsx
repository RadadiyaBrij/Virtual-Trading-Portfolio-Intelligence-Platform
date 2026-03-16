import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="bg-black border-b border-black top-0 z-50">
      <nav className="m-0 p-3 h-20 flex items-center justify-between">

        {/* Logo Section */}
        <div className="flex items-center">
          <Link to="/" className="relative text-3xl font-bold flex items-center transition-all duration-500 ease-in-out
             bg-linear-to-t from-blue-600 from-50% to-white to-50% 
             bg-size-[100%_200%] bg-position-[0_0%] 
             hover:bg-position-[0_100%] 
             bg-clip-text text-transparent">
            <span className="text-blue-500 mr-1">Trading</span>Intel
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex lg:flex xl:flex items-center space-x-2">
          <Link to="/dashboard" className="text-white hover:bg-blue-500 px-4 py-2 rounded-md text-lg font-semibold transition-all ease-in-out">
            Dashboard
          </Link>
        
          {/* Markets Dropdown */}
          <div className="relative group">
            <Link to="/market" className="text-white hover:bg-blue-500 px-4 py-2 rounded-md text-lg font-semibold transition-all ease-in-out flex items-center">
              Markets <span className="ml-1 text-xs">▼</span>
            </Link>
            {/* Dropdown */}
            <div className="absolute left-0 top-full pt-1 w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="bg-black border border-gray-800 rounded-md shadow-lg flex flex-col p-1">
                <Link to="/market/stocks" className="px-4 py-2 text-white hover:bg-blue-500 rounded-md transition-colors text-base font-medium">
                  Stocks
                </Link>
              </div>
            </div>
          </div>

          <Link to="/portfolio" className="text-white hover:bg-blue-500 px-4 py-2 rounded-md text-lg font-semibold transition-all ease-in-out">
            Portfolio
          </Link>
          <Link to="/trade" className="text-white hover:bg-blue-500 px-4 py-2 rounded-md text-lg font-semibold transition-all ease-in-out">
            Trade
          </Link>
          <Link to="/news" className="text-white hover:bg-blue-500 px-4 py-2 rounded-md text-lg font-semibold transition-all ease-in-out">
            News
          </Link>
        </div>

        {/*  login button */}
        <div className="flex items-center">
          <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-md text-xl font-semibold transition-all ease-in-out shadow-sm shadow-blue-500/50">
            Log In
          </Link>
        </div>

      </nav>
    </header>
  );
}

export default Navbar;