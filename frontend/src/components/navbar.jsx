import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FiChevronDown, FiMenu, FiX, FiLogOut, FiPieChart, FiActivity, FiGlobe } from 'react-icons/fi';

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const NavLink = ({ to, children, icon: Icon }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-emerald-600/10 text-emerald-400' 
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        {Icon && <Icon size={16} />}
        {children}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-100 bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl leading-none">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white uppercase">Capital Terminal</span>
          </Link>

          <div className="hidden lg:flex items-center space-x-1">
            <NavLink to="/dashboard" icon={FiActivity}>Dashboard</NavLink>
            <div className="relative group">
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                Markets <FiChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="w-56 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-2 overflow-hidden backdrop-blur-xl">
                  <Link to="/market/stocks" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                    <FiActivity size={16} /> Equities Screener
                  </Link>
                  <Link to="/news" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                    <FiGlobe size={16} /> Market Intelligence
                  </Link>
                </div>
              </div>
            </div>
            <NavLink to="/portfolio" icon={FiPieChart}>Portfolio</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-white truncate max-w-[150px]">{session.user.email.split('@')[0]}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Member</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/20 transition-all"
                title="Log Out"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="px-5 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">Sign In</Link>
              <Link to="/signup" className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20">Start Trading</Link>
            </div>
          )}
          
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-gray-950 border-b border-white/5 px-6 pb-8 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-2 mt-4">
            <Link to="/dashboard" className="px-4 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 font-medium transition-colors">Dashboard</Link>
            <Link to="/market/stocks" className="px-4 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 font-medium transition-colors">Equities</Link>
            <Link to="/news" className="px-4 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 font-medium transition-colors">Intelligence</Link>
            <Link to="/portfolio" className="px-4 py-3 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 font-medium transition-colors">Portfolio</Link>
          </div>
        </div>
      )}
    </nav>
  );
}