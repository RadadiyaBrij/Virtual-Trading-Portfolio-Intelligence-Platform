import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="bg-black border-b border-black top-0 z-50">
      <nav className="m-0 p-3 h-20 flex items-center justify-between">

        {/* Logo Section */}
        <div className="flex items-center">
          <Link to="/" className="text-3xl font-bold text-white flex items-center">
            <span className="text-blue-500 mr-1">Trading</span>Intel
          </Link>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex lg:flex xl:flex items-center space-x-2">
          <Link to="/dashboard" className="text-white hover:text-white hover:bg-black px-5 py-2 rounded-md text-xl font-semibold transition-all ease-in-out">
            Dashboard
          </Link>
          <Link to="/portfolio" className="text-white hover:text-white hover:bg-black px-5 py-2 rounded-md text-xl font-semibold transition-all ease-in-out">
            Portfolio
          </Link>
          <Link to="/market" className="text-white hover:text-white hover:bg-black px-5 py-2 rounded-md text-xl font-semibold transition-all ease-in-out">
            Market
          </Link>
        </div>

        {/*   login button */}
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