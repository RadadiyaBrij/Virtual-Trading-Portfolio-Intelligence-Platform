import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Navbar from './components/navbar'
import Stocks from './pages/stocks'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/market/stocks" element={<Stocks />} />
      </Routes>
    </>
  )
}

export default App
