import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Navbar from './components/navbar'
import Stocks from './pages/stocks'
import StockDetails from './pages/StockDetails'
import StockAnalysis from './pages/StockAnalysis'
import News from './pages/News'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Portfolio from './pages/Portfolio'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null; 

  return (
    <>
      <Navbar />
      <div className="bg-black min-h-screen">
        <Routes>
          <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          
          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/market/stocks" element={<Stocks />} />
          <Route path="/stocks/:symbol" element={<StockDetails />} />
          <Route path="/stocks/:symbol/analysis" element={<StockAnalysis />} />
          <Route path="/news" element={<News />} />
          <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/signup" element={session ? <Navigate to="/dashboard" /> : <Signup />} />
          <Route path="/portfolio" element={session ? <Portfolio /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </>
  )
}

export default App
