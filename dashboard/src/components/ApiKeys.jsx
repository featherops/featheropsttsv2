import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Key, Plus, Trash2, Copy, LogOut, Activity, Mic, Settings, Link as LinkIcon, ExternalLink } from 'lucide-react'
import axios from 'axios'

const ApiKeys = ({ onLogout }) => {
  const [keys, setKeys] = useState([])
  const [originalKeys, setOriginalKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showOriginalForm, setShowOriginalForm] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000)
  const [selectedOriginalKey, setSelectedOriginalKey] = useState('')
  const [newOriginalKeyName, setNewOriginalKeyName] = useState('')
  const [newOriginalKeyApiKey, setNewOriginalKeyApiKey] = useState('')
  const [newOriginalKeyEndpoint, setNewOriginalKeyEndpoint] = useState('')
  const [creating, setCreating] = useState(false)
  const [creatingOriginal, setCreatingOriginal] = useState(false)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null)
  const [activeTab, setActiveTab] = useState('custom')
  const navigate = useNavigate()

  useEffect(() => {
    fetchKeys()
    fetchOriginalKeys()
  }, [])

  const fetchKeys = async () => {
    try {
      const response = await axios.get('/dashboard/api/keys', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      setKeys(response.data.keys)
    } catch (error) {
      console.error('Failed to fetch keys:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOriginalKeys = async () => {
    try {
      const response = await axios.get('/dashboard/api/original-keys', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      setOriginalKeys(response.data.keys)
    } catch (error) {
      console.error('Failed to fetch original keys:', error)
    }
  }

  const handleCreateKey = async (e) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await axios.post('/dashboard/api/keys', {
        name: newKeyName,
        rateLimit: parseInt(newKeyRateLimit),
        originalKeyId: selectedOriginalKey || undefined
      }, {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })

      if (response.data.success) {
        setNewlyCreatedKey(response.data.key)
        setNewKeyName('')
        setNewKeyRateLimit(1000)
        setSelectedOriginalKey('')
        setShowCreateForm(false)
        fetchKeys()
      }
    } catch (error) {
      console.error('Failed to create key:', error)
      alert('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateOriginalKey = async (e) => {
    e.preventDefault()
    setCreatingOriginal(true)

    try {
      const response = await axios.post('/dashboard/api/original-keys', {
        name: newOriginalKeyName,
        apiKey: newOriginalKeyApiKey,
        endpoint: newOriginalKeyEndpoint
      }, {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })

      if (response.data.success) {
        setNewOriginalKeyName('')
        setNewOriginalKeyApiKey('')
        setNewOriginalKeyEndpoint('')
        setShowOriginalForm(false)
        fetchOriginalKeys()
      }
    } catch (error) {
      console.error('Failed to create original key:', error)
      alert('Failed to create original API key')
    } finally {
      setCreatingOriginal(false)
    }
  }

  const handleDeleteKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      await axios.delete(`/dashboard/api/keys/${keyId}`, {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      fetchKeys()
    } catch (error) {
      console.error('Failed to delete key:', error)
      alert('Failed to delete API key')
    }
  }

  const handleDeleteOriginalKey = async (keyId) => {
    if (!window.confirm('Are you sure you want to delete this original API key? This will affect all custom keys linked to it.')) {
      return
    }

    try {
      await axios.delete(`/dashboard/api/original-keys/${keyId}`, {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      fetchOriginalKeys()
      fetchKeys()
    } catch (error) {
      console.error('Failed to delete original key:', error)
      alert('Failed to delete original API key')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('API key copied to clipboard!')
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white/30 border-t-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                FeatherOps TTS Dashboard
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-6 py-3 border border-white/20 text-sm font-medium rounded-xl text-white bg-red-500/20 hover:bg-red-500/30 backdrop-blur-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            <Link
              to="/"
              className="border-transparent text-white/70 hover:text-white hover:border-white/30 inline-flex items-center px-3 py-4 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <Activity className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </Link>
            <Link
              to="/playground"
              className="border-transparent text-white/70 hover:text-white hover:border-white/30 inline-flex items-center px-3 py-4 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105"
            >
              <Mic className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Voice Playground</span>
            </Link>
            <Link
              to="/api-keys"
              className="border-white text-white inline-flex items-center px-3 py-4 border-b-2 text-sm font-medium"
            >
              <Key className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">API Keys</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-xl p-1">
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'custom'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Key className="w-4 h-4 mr-2 inline" />
              Custom API Keys
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === 'original'
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <ExternalLink className="w-4 h-4 mr-2 inline" />
              Original API Keys
            </button>
          </div>
        </div>

        {/* Custom API Keys Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            {/* Create New Key Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Custom API Keys</h2>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center px-6 py-3 border border-white/20 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New API Key
              </button>
            </div>

            {/* Create Key Form */}
            {showCreateForm && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 animate-fadeIn">
                <h3 className="text-xl font-bold text-white mb-6">Create New API Key</h3>
                <form onSubmit={handleCreateKey} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="keyName" className="block text-sm font-medium text-white/90 mb-2">
                        Key Name
                      </label>
                      <input
                        type="text"
                        id="keyName"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-lg transition-all duration-300"
                        placeholder="e.g., Client A, Test Key"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="rateLimit" className="block text-sm font-medium text-white/90 mb-2">
                        Rate Limit (requests/day)
                      </label>
                      <input
                        type="number"
                        id="rateLimit"
                        value={newKeyRateLimit}
                        onChange={(e) => setNewKeyRateLimit(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-lg transition-all duration-300"
                        min="1"
                        max="10000"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="originalKey" className="block text-sm font-medium text-white/90 mb-2">
                      Link to Original API Key (Optional)
                    </label>
                    <select
                      id="originalKey"
                      value={selectedOriginalKey}
                      onChange={(e) => setSelectedOriginalKey(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-lg transition-all duration-300"
                    >
                      <option value="">Use default original key</option>
                      {originalKeys.map((key) => (
                        <option key={key.id} value={key.id} className="bg-gray-800 text-white">
                          {key.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={creating}
                      className="flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-lg"
                    >
                      {creating ? 'Creating...' : 'Create Key'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-6 py-3 border border-white/20 text-sm font-medium rounded-xl text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Newly Created Key Display */}
            {newlyCreatedKey && (
              <div className="bg-green-500/20 backdrop-blur-lg border border-green-400/30 rounded-2xl p-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-green-300 mb-2">API Key Created Successfully!</h3>
                <p className="text-green-200 mb-4">Please copy this API key now. You won't be able to see it again.</p>
                <div className="flex items-center space-x-3">
                  <code className="flex-1 bg-black/30 border border-green-400/30 rounded-xl px-4 py-3 text-sm font-mono text-green-300 backdrop-blur-lg">
                    {newlyCreatedKey.apiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newlyCreatedKey.apiKey)}
                    className="flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-green-500/20 hover:bg-green-500/30 transition-all duration-300 hover:scale-105 backdrop-blur-lg"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => setNewlyCreatedKey(null)}
                  className="mt-4 text-green-300 hover:text-green-100 text-sm transition-colors duration-300"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* API Keys List */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Your API Keys</h3>
                <div className="space-y-4">
                  {keys.map((key) => (
                    <div key={key.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                              <Key className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-white">{key.name}</div>
                            <div className="text-sm text-white/70">
                              {key.apiKey} • Created {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-white/70">
                              Usage: {key.usageCount} requests • Rate Limit: {key.rateLimit}/day
                            </div>
                            {key.originalKeyName && (
                              <div className="text-sm text-purple-300 flex items-center mt-1">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Linked to: {key.originalKeyName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            key.status === 'active' 
                              ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                              : 'bg-red-500/20 text-red-300 border border-red-400/30'
                          }`}>
                            {key.status}
                          </span>
                          <button
                            onClick={() => handleDeleteKey(key.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 hover:scale-110"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {keys.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Key className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No API keys</h3>
                    <p className="text-white/70">Get started by creating a new API key.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Original API Keys Tab */}
        {activeTab === 'original' && (
          <div className="space-y-6">
            {/* Create Original Key Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Original API Keys</h2>
              <button
                onClick={() => setShowOriginalForm(!showOriginalForm)}
                className="flex items-center px-6 py-3 border border-white/20 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Original API Key
              </button>
            </div>

            {/* Create Original Key Form */}
            {showOriginalForm && (
              <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 animate-fadeIn">
                <h3 className="text-xl font-bold text-white mb-6">Add Original API Key</h3>
                <form onSubmit={handleCreateOriginalKey} className="space-y-6">
                  <div>
                    <label htmlFor="originalKeyName" className="block text-sm font-medium text-white/90 mb-2">
                      Key Name
                    </label>
                    <input
                      type="text"
                      id="originalKeyName"
                      value={newOriginalKeyName}
                      onChange={(e) => setNewOriginalKeyName(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg transition-all duration-300"
                      placeholder="e.g., Primary Key, Backup Key"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="originalKeyApiKey" className="block text-sm font-medium text-white/90 mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      id="originalKeyApiKey"
                      value={newOriginalKeyApiKey}
                      onChange={(e) => setNewOriginalKeyApiKey(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg transition-all duration-300"
                      placeholder="Enter the original API key"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="originalKeyEndpoint" className="block text-sm font-medium text-white/90 mb-2">
                      Endpoint URL
                    </label>
                    <input
                      type="url"
                      id="originalKeyEndpoint"
                      value={newOriginalKeyEndpoint}
                      onChange={(e) => setNewOriginalKeyEndpoint(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-lg transition-all duration-300"
                      placeholder="https://api.example.com/tools/tts/v2"
                      required
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={creatingOriginal}
                      className="flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-lg"
                    >
                      {creatingOriginal ? 'Adding...' : 'Add Key'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOriginalForm(false)}
                      className="px-6 py-3 border border-white/20 text-sm font-medium rounded-xl text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Original API Keys List */}
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Original API Keys</h3>
                <div className="space-y-4">
                  {originalKeys.map((key) => (
                    <div key={key.id} className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                              <ExternalLink className="h-6 w-6 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-white">{key.name}</div>
                            <div className="text-sm text-white/70">
                              Endpoint: {key.endpoint}
                            </div>
                            <div className="text-sm text-white/70">
                              API Key: {key.apiKey.substring(0, 20)}...
                            </div>
                            <div className="text-sm text-white/70">
                              Created: {new Date(key.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            Active
                          </span>
                          <button
                            onClick={() => handleDeleteOriginalKey(key.id)}
                            className="text-red-400 hover:text-red-300 transition-colors duration-300 hover:scale-110"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {originalKeys.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ExternalLink className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No original API keys</h3>
                    <p className="text-white/70">Add your first original API key to get started.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default ApiKeys 