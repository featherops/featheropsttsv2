const express = require('express');
const { authenticateDashboard, checkDashboardSession } = require('../middleware/auth');
const { 
  createCustomApiKey, 
  createOriginalApiKey,
  getAllCustomKeys,
  getAllCustomKeysFull, 
  getAllOriginalKeys,
  getOriginalKeyForCustomKey,
  updateKeyMapping,
  deleteCustomApiKey,
  deleteOriginalApiKey, 
  getUsageStats 
} = require('../utils/apiKeyManager');
const { getVoices, getVoiceStats, refreshVoicesCache } = require('../utils/voiceManager');
const ttsController = require('../controllers/ttsController');

const router = express.Router();

// In-memory storage for TTS response history (last 10 responses)
let ttsHistory = [];

// Dashboard login
router.post('/login', (req, res) => {
  const { masterKey } = req.body;
  const actualMasterKey = process.env.MASTER_KEY;

  if (masterKey === actualMasterKey) {
    res.json({
      success: true,
      message: 'Dashboard access granted',
      token: 'dashboard-access'
    });
  } else {
    res.status(401).json({
      error: {
        message: 'Invalid master key',
        type: 'authentication_error',
        status: 401
      }
    });
  }
});

// Dashboard home page
router.get('/', (req, res) => {
  const dashboardPath = path.join(__dirname, '../../dashboard/dist/index.html');
  
  // Check if dashboard file exists
  if (!require('fs').existsSync(dashboardPath)) {
    return res.status(500).json({
      error: {
        message: 'Dashboard not built. Please run: npm run build:client',
        type: 'internal_error',
        status: 500
      }
    });
  }
  
  res.sendFile('index.html', { root: './dashboard/dist' });
});

// Dashboard API routes (protected)
router.use('/api', checkDashboardSession);

// Get dashboard statistics
router.get('/api/stats', async (req, res) => {
  try {
    const [usageStats, voiceStats] = await Promise.all([
      getUsageStats(),
      getVoiceStats()
    ]);

    res.json({
      usage: usageStats,
      voices: voiceStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Get all custom API keys
router.get('/api/keys', async (req, res) => {
  try {
    const keys = await getAllCustomKeys();
    res.json({ keys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Get all original API keys
router.get('/api/original-keys', async (req, res) => {
  try {
    const keys = await getAllOriginalKeys();
    res.json({ keys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get original API keys' });
  }
});

// Get API keys for playground (simplified version)
router.get('/api/playground-keys', async (req, res) => {
  try {
    const keys = await getAllCustomKeysFull();
    // Return only active keys with basic info for playground
    const playgroundKeys = keys.filter(key => key.status === 'active').map(key => ({
      id: key.id,
      name: key.name,
      apiKey: key.apiKey, // Full API key for playground use
      usageCount: key.usageCount,
      createdAt: key.createdAt
    }));
    res.json({ keys: playgroundKeys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Create new custom API key
router.post('/api/keys', async (req, res) => {
  try {
    const { name, rateLimit = 1000, originalKeyId } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const newKey = await createCustomApiKey(name, rateLimit, originalKeyId);
    res.json({ 
      success: true, 
      key: newKey,
      message: 'API key created successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Create new original API key
router.post('/api/original-keys', async (req, res) => {
  try {
    const { name, apiKey, endpoint } = req.body;
    
    if (!name || !apiKey || !endpoint) {
      return res.status(400).json({ error: 'Name, API key, and endpoint are required' });
    }

    const newKey = await createOriginalApiKey(name, apiKey, endpoint);
    res.json({ 
      success: true, 
      key: newKey,
      message: 'Original API key created successfully' 
    });
  } catch (error) {
    console.error('Error creating original API key:', error);
    res.status(500).json({ error: 'Failed to create original API key' });
  }
});

// Delete original API key
router.delete('/api/original-keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    await deleteOriginalApiKey(keyId);
    res.json({ 
      success: true, 
      message: 'Original API key deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting original API key:', error);
    res.status(500).json({ error: 'Failed to delete original API key' });
  }
});

// Delete custom API key
router.delete('/api/keys/:keyId', async (req, res) => {
  try {
    const { keyId } = req.params;
    await deleteCustomApiKey(keyId);
    res.json({ 
      success: true, 
      message: 'API key deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

// Get voices for playground
router.get('/api/voices', async (req, res) => {
  try {
    const { language, engine, gender, category, search, limit = 100 } = req.query;
    
    const filters = {
      language,
      engine,
      gender,
      category,
      search
    };
    
    const voices = await getVoices(filters);
    const limitedVoices = voices.slice(0, parseInt(limit));
    
    res.json({ voices: limitedVoices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voices' });
  }
});

// Test TTS in playground
router.post('/api/test-tts', async (req, res) => {
  try {
    const { text, voice, apiKey } = req.body;
    
    if (!text || !voice) {
      return res.status(400).json({ error: 'Text and voice are required' });
    }

    // Use provided API key or default to the first available key
    let selectedApiKey = apiKey;
    if (!selectedApiKey) {
      const keys = await getAllCustomKeysFull();
      if (keys.length > 0) {
        selectedApiKey = keys[0].apiKey;
      } else {
        return res.status(400).json({ error: 'No API keys available. Please create an API key first.' });
      }
    }

    // Validate the API key first
    const allKeys = await getAllCustomKeysFull();
    const validKey = allKeys.find(key => key.apiKey === selectedApiKey);
    if (!validKey) {
      return res.status(400).json({ error: 'Invalid API key' });
    }

    // Create a mock request and response for the TTS controller
    const mockReq = {
      body: {
        model: 'tts-1',
        voice: voice,
        input: text,
        response_format: 'mp3',
        speed: 1.0
      },
      headers: {
        'authorization': `Bearer ${selectedApiKey}`
      }
    };

    let audioBuffer = null;
    const mockRes = {
      status: (code) => mockRes,
      json: (data) => {
        if (data.error) {
          throw new Error(data.error.message || 'TTS generation failed');
        }
        return mockRes;
      },
      send: (data) => {
        audioBuffer = data;
        return mockRes;
      },
      set: (header, value) => mockRes
    };

    // Call the TTS controller directly
    await ttsController.generateSpeech(mockReq, mockRes);

    // Convert audio buffer to base64
    const audioBase64 = audioBuffer.toString('base64');
    
    // Get API key name for display
    const usedKey = allKeys.find(key => key.apiKey === selectedApiKey);
    const apiKeyName = usedKey ? usedKey.name : 'Unknown Key';

    // Create response object
    const response = {
      id: Date.now().toString(),
      audio: `data:audio/mpeg;base64,${audioBase64}`,
      timestamp: new Date().toISOString(),
      voice: voice,
      text: text,
      duration: Math.round(audioBuffer.length / 1000), // Approximate duration in seconds
      apiKey: selectedApiKey,
      apiKeyName: apiKeyName
    };
    
    // Add to history (keep only last 10)
    ttsHistory.unshift(response);
    if (ttsHistory.length > 10) {
      ttsHistory = ttsHistory.slice(0, 10);
    }
    
    res.json({
      success: true,
      ...response
    });
  } catch (error) {
    console.error('TTS test error:', error);
    res.status(500).json({ error: 'Failed to generate test audio' });
  }
});

// Get voice categories for filtering
router.get('/api/voice-categories', async (req, res) => {
  try {
    const voices = await getVoices();
    
    const categories = {
      languages: [...new Set(voices.map(v => v.language))].sort(),
      engines: [...new Set(voices.map(v => v.engine))].sort(),
      genders: [...new Set(voices.map(v => v.gender))].sort(),
      categories: [...new Set(voices.map(v => v.category))].sort()
    };
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voice categories' });
  }
});

// Refresh voices cache
router.post('/api/refresh-voices', async (req, res) => {
  try {
    const voices = await refreshVoicesCache();
    
    res.json({
      success: true,
      message: `Refreshed voice cache with ${voices.length} voices`,
      count: voices.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh voices cache' });
  }
});

// Get TTS history
router.get('/api/tts-history', (req, res) => {
  try {
    res.json({
      success: true,
      history: ttsHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get TTS history' });
  }
});

// Delete specific TTS response from history
router.delete('/api/tts-history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const initialLength = ttsHistory.length;
    ttsHistory = ttsHistory.filter(item => item.id !== id);
    
    if (ttsHistory.length === initialLength) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    res.json({
      success: true,
      message: 'Response deleted from history',
      history: ttsHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Clear all TTS history
router.delete('/api/tts-history', (req, res) => {
  try {
    ttsHistory = [];
    res.json({
      success: true,
      message: 'TTS history cleared',
      history: ttsHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

module.exports = router; 