import type { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import FindingView from './pages/FindingView'
import Login from './pages/Login'
import Register from './pages/Register'
import ScanProgress from './pages/ScanProgress'
import Navbar from './components/Navbar'

function Protected({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/scan/:id" element={<Protected><ScanProgress /></Protected>} />
        <Route path="/finding/:id" element={<Protected><FindingView /></Protected>} />
      </Routes>
    </div>
  )
}
