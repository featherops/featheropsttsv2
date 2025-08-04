import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import VoicePlayground from './components/VoicePlayground'
import ApiKeys from './components/ApiKeys'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('dashboard-token')
    if (token === 'dashboard-access') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleLogin = (token) => {
    localStorage.setItem('dashboard-token', token)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('dashboard-token')
    setIsAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white/30 border-t-white mx-auto mb-8"></div>
          <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
            FeatherOps TTS
          </h1>
          <p className="text-white/70 mt-2 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/" replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                <Dashboard onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/playground" 
            element={
              isAuthenticated ? 
                <VoicePlayground onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/api-keys" 
            element={
              isAuthenticated ? 
                <ApiKeys onLogout={handleLogout} /> : 
                <Navigate to="/login" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 