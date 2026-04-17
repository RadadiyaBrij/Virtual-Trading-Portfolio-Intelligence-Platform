import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center text-blue-500">Welcome Back</h1>
        <p className="text-gray-400 mb-8 text-md font-medium text-center">Login to your account</p>

        {error && <div className="bg-red-900/30 border border-red-500/50 text-red-300 p-3 rounded-lg mb-6 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-black border border-gray-800 p-3 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-black border border-gray-800 p-3 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-800 cursor-pointer text-white hover:scale-105 font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-md font-medium text-gray-500">
          Don't have an account? <Link to="/signup" className="text-blue-400 hover:text-blue-300 hover:font-bold">Create one</Link>
        </div>
      </div>
    </div>
  );
}
