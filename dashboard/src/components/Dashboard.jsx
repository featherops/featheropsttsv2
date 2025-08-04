import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Key, Mic, LogOut, Activity, Users, FileAudio } from 'lucide-react'
import axios from 'axios'

const Dashboard = ({ onLogout }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get('/dashboard/api/stats', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      setStats(response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                FeatherOps TTS Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm shadow-sm border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap space-x-2 sm:space-x-8">
            <Link
              to="/"
              className="border-purple-500 text-purple-700 inline-flex items-center px-2 py-2 sm:px-1 sm:pt-1 border-b-2 text-sm font-medium transition-all duration-200"
            >
              <Activity className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </Link>
            <Link
              to="/playground"
              className="border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-300 inline-flex items-center px-2 py-2 sm:px-1 sm:pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Mic className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Voice Playground</span>
            </Link>
            <Link
              to="/api-keys"
              className="border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-300 inline-flex items-center px-2 py-2 sm:px-1 sm:pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Key className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">API Keys</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-purple-100 transform hover:scale-105 transition-all duration-300">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Key className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total API Keys
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.usage?.totalKeys || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Keys
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.usage?.activeKeys || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Usage
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.usage?.totalUsage || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <FileAudio className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Available Voices
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats?.voices?.total || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Stats */}
          {stats?.voices && (
            <div className="mt-8">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Voice Statistics
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(stats.voices.byEngine || {}).map(([engine, count]) => (
                  <div key={engine} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {engine.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              {engine.charAt(0).toUpperCase() + engine.slice(1)}
                            </dt>
                            <dd className="text-lg font-medium text-gray-900">
                              {count}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard 