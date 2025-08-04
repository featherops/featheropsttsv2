import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, Play, Pause, LogOut, Activity, Key, Search, Filter, Download } from 'lucide-react'
import axios from 'axios'

const VoicePlayground = ({ onLogout }) => {
  const [voices, setVoices] = useState([])
  const [filteredVoices, setFilteredVoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [testText, setTestText] = useState('Hello, this is a test of the text-to-speech system.')
  const [selectedVoice, setSelectedVoice] = useState('')
  const [generating, setGenerating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    language: '',
    engine: '',
    gender: '',
    category: ''
  })
  const [categories, setCategories] = useState({})
  const [ttsHistory, setTtsHistory] = useState([])
  const [apiKeys, setApiKeys] = useState([])
  const [selectedApiKey, setSelectedApiKey] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchVoices()
    fetchCategories()
    fetchTtsHistory()
    fetchApiKeys()
  }, [])

  useEffect(() => {
    filterVoices()
  }, [voices, searchTerm, filters])

  const fetchVoices = async () => {
    try {
      const response = await axios.get('/dashboard/api/voices', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      setVoices(response.data.voices)
    } catch (error) {
      console.error('Failed to fetch voices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/dashboard/api/voice-categories', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchTtsHistory = async () => {
    try {
      const response = await axios.get('/dashboard/api/tts-history', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      if (response.data.success) {
        setTtsHistory(response.data.history)
      }
    } catch (error) {
      console.error('Failed to fetch TTS history:', error)
    }
  }

  const deleteTtsResponse = async (id) => {
    try {
      const response = await axios.delete(`/dashboard/api/tts-history/${id}`, {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      if (response.data.success) {
        setTtsHistory(response.data.history)
      }
    } catch (error) {
      console.error('Failed to delete TTS response:', error)
    }
  }

  const clearTtsHistory = async () => {
    try {
      const response = await axios.delete('/dashboard/api/tts-history', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      if (response.data.success) {
        setTtsHistory(response.data.history)
      }
    } catch (error) {
      console.error('Failed to clear TTS history:', error)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get('/dashboard/api/playground-keys', {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })
      setApiKeys(response.data.keys)
      // Auto-select the first API key if available
      if (response.data.keys.length > 0 && !selectedApiKey) {
        setSelectedApiKey(response.data.keys[0].apiKey)
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error)
    }
  }

  const filterVoices = () => {
    let filtered = voices

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(voice =>
        voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voice.language.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voice.engine.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply other filters
    if (filters.language) {
      filtered = filtered.filter(voice => voice.language === filters.language)
    }
    if (filters.engine) {
      filtered = filtered.filter(voice => voice.engine === filters.engine)
    }
    if (filters.gender) {
      filtered = filtered.filter(voice => voice.gender === filters.gender)
    }
    if (filters.category) {
      filtered = filtered.filter(voice => voice.category === filters.category)
    }

    // Sort by quality: high first, then medium, then others
    filtered.sort((a, b) => {
      const qualityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const aQuality = qualityOrder[a.quality] || 0;
      const bQuality = qualityOrder[b.quality] || 0;
      return bQuality - aQuality;
    });

    setFilteredVoices(filtered)
  }

  const handleTestVoice = async () => {
    if (!selectedVoice || !testText.trim()) {
      alert('Please select a voice and enter some text to test.')
      return
    }
    
    if (!selectedApiKey) {
      alert('Please select an API key to use for testing.')
      return
    }

    setGenerating(true)
    try {
      const response = await axios.post('/dashboard/api/test-tts', {
        text: testText,
        voice: selectedVoice,
        apiKey: selectedApiKey
      }, {
        headers: {
          'Authorization': 'dashboard-access'
        }
      })

      if (response.data.success) {
        // Refresh history after successful generation
        fetchTtsHistory()
        alert('Audio generated successfully! Check the history section below to download.')
      } else {
        alert('Failed to generate audio')
      }
    } catch (error) {
      console.error('Failed to test voice:', error)
      alert('Failed to generate audio')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadAudio = (audioData, fileName) => {
    try {
      // Remove the data URL prefix if present
      const base64Data = audioData.replace('data:audio/mpeg;base64,', '');
      const audioBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      
      // Create download link
      const downloadUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'tts-audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to download audio:', error);
      alert('Failed to download audio file');
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
                FeatherOps TTS - Voice Playground
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
              className="border-transparent text-gray-600 hover:text-purple-600 hover:border-purple-300 inline-flex items-center px-2 py-2 sm:px-1 sm:pt-1 border-b-2 text-sm font-medium transition-all duration-200 hover:scale-105"
            >
              <Activity className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </Link>
            <Link
              to="/playground"
              className="border-purple-500 text-purple-700 inline-flex items-center px-2 py-2 sm:px-1 sm:pt-1 border-b-2 text-sm font-medium transition-all duration-200"
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
          {/* Test Section */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-4 sm:p-6 border border-purple-100 transform hover:scale-[1.02] transition-all duration-300">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mic className="w-5 h-5 mr-2 text-purple-600" />
              Test Voice
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
              <div>
                <label htmlFor="testText" className="block text-sm font-medium text-gray-700 mb-2">
                  Text to Convert
                </label>
                <textarea
                  id="testText"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter text to convert to speech..."
                />
              </div>
              <div>
                <label htmlFor="selectedVoice" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Voice
                </label>
                <select
                  id="selectedVoice"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Choose a voice...</option>
                  {voices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name} ({voice.language}, {voice.engine})
                    </option>
                  ))}
                </select>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={handleTestVoice}
                    disabled={generating || !selectedVoice || !testText.trim() || !selectedApiKey}
                    className="flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 mr-2" />
                        Generate Audio
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="selectedApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <select
                  id="selectedApiKey"
                  value={selectedApiKey}
                  onChange={(e) => setSelectedApiKey(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Choose an API key...</option>
                  {apiKeys.map((key) => (
                    <option key={key.id} value={key.apiKey}>
                      {key.name} (Used: {key.usageCount} times)
                    </option>
                  ))}
                </select>
                {apiKeys.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">
                    No API keys available. Please create one in the API Keys section.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-4 sm:p-6 border border-purple-100 transform hover:scale-[1.01] transition-all duration-300">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-purple-600" />
              Voice Filters
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search voices..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={filters.language}
                  onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Languages</option>
                  {categories.languages?.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
                <select
                  value={filters.engine}
                  onChange={(e) => setFilters({ ...filters, engine: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Engines</option>
                  {categories.engines?.map((engine) => (
                    <option key={engine} value={engine}>{engine}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Genders</option>
                  {categories.genders?.map((gender) => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.categories?.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Response History */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-purple-100 transform hover:scale-[1.01] transition-all duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-purple-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-purple-600" />
                Response History ({ttsHistory.length})
              </h3>
              {ttsHistory.length > 0 && (
                <button
                  onClick={clearTtsHistory}
                  className="text-sm text-red-600 hover:text-red-800 transform hover:scale-105 transition-all duration-200"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="p-4 sm:p-6">
              {ttsHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Mic className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No responses yet</h3>
                  <p className="mt-1 text-sm text-gray-500">Generate some audio to see your history here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ttsHistory.map((response) => (
                    <div key={response.id} className="border border-purple-200 rounded-xl p-4 bg-white/50 backdrop-blur-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                                                     <div className="flex items-center space-x-2 mb-2">
                             <span className="text-sm font-medium text-gray-900">{response.voice}</span>
                             <span className="text-xs text-gray-500">•</span>
                             <span className="text-xs text-gray-500">{new Date(response.timestamp).toLocaleString()}</span>
                             <span className="text-xs text-gray-500">•</span>
                             <span className="text-xs text-gray-500">{response.duration}s</span>
                             <span className="text-xs text-gray-500">•</span>
                             <span className="text-xs text-blue-600 font-medium">{response.apiKeyName || 'Unknown Key'}</span>
                           </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{response.text}</p>
                        </div>
                        <button
                          onClick={() => deleteTtsResponse(response.id)}
                          className="text-red-600 hover:text-red-800 text-sm transform hover:scale-110 transition-all duration-200"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center space-x-2 mt-3">
                        <button
                          onClick={() => handleDownloadAudio(response.audio, `${response.voice}-${Date.now()}.mp3`)}
                          className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Audio
                        </button>
                        <span className="text-xs text-gray-500">
                          {response.duration}s • {Math.round((response.audio.length * 0.75) / 1024)}KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Voices Grid */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl border border-purple-100 transform hover:scale-[1.01] transition-all duration-300">
            <div className="px-4 sm:px-6 py-4 border-b border-purple-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-purple-600" />
                Available Voices ({filteredVoices.length})
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredVoices.map((voice) => (
                <div
                  key={voice.id}
                  className={`border rounded-xl p-4 cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    selectedVoice === voice.id
                      ? 'border-purple-500 bg-purple-50 shadow-lg'
                      : 'border-purple-200 hover:border-purple-300 bg-white/60 backdrop-blur-sm hover:shadow-md'
                  }`}
                  onClick={() => setSelectedVoice(voice.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{voice.name}</h4>
                                         <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                       voice.quality === 'high' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' :
                       voice.quality === 'medium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg' :
                       'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
                     }`}>
                       {voice.quality}
                     </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Language: {voice.language}</div>
                    <div>Engine: {voice.engine}</div>
                    <div>Gender: {voice.gender}</div>
                    <div>Category: {voice.category}</div>
                  </div>
                </div>
              ))}
            </div>
            {filteredVoices.length === 0 && (
              <div className="text-center py-12">
                <Mic className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No voices found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default VoicePlayground 