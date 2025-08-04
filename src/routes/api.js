const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticateApiKey } = require('../middleware/auth');
const { updateApiKeyUsage } = require('../utils/apiKeyManager');
const { getVoices, getVoiceById } = require('../utils/voiceManager');
const ttsController = require('../controllers/ttsController');

const router = express.Router();

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      message: 'Too many requests from this IP, please try again later.',
      type: 'rate_limit_error'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all API routes
router.use(apiLimiter);

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: process.env.YOUR_SERVICE_NAME || 'PerchanceTTS',
    version: process.env.YOUR_SERVICE_VERSION || 'v1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Apply authentication to all other routes
router.use(authenticateApiKey);

// OpenAI-compatible TTS endpoint
router.post('/audio/speech', async (req, res, next) => {
  try {
    // Update API key usage
    await updateApiKeyUsage(req.apiKeyInfo.apiKey);
    
    // Call TTS controller
    await ttsController.generateSpeech(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Get available voices
router.get('/voices', async (req, res, next) => {
  try {
    const { language, engine, gender, category, search, limit = 50, offset = 0 } = req.query;
    
    const filters = {
      language,
      engine,
      gender,
      category,
      search
    };
    
    const voices = await getVoices(filters);
    
    // Apply pagination
    const paginatedVoices = voices.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      data: paginatedVoices.map(voice => ({
        id: voice.name, // Use just the voice name as ID for OpenAI compatibility
        name: voice.name,
        language: voice.language,
        engine: voice.engine,
        gender: voice.gender,
        category: voice.category,
        quality: voice.quality
      })),
      pagination: {
        total: voices.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < voices.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get voice by ID
router.get('/voices/:voiceId', async (req, res, next) => {
  try {
    const { voiceId } = req.params;
    
    // Try to find voice by full ID first, then by name
    let voice = await getVoiceById(voiceId);
    
    if (!voice) {
      // Try to find by voice name only
      const voices = await getVoices();
      voice = voices.find(v => v.name === voiceId);
    }
    
    if (!voice) {
      return res.status(404).json({
        error: {
          message: 'Voice not found',
          type: 'not_found_error'
        }
      });
    }
    
    res.json({
      data: {
        id: voice.name, // Use just the voice name as ID for OpenAI compatibility
        name: voice.name,
        language: voice.language,
        engine: voice.engine,
        gender: voice.gender,
        category: voice.category,
        quality: voice.quality
      }
    });
  } catch (error) {
    next(error);
  }
});

// Health check endpoint (no authentication required)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: process.env.YOUR_SERVICE_NAME,
    version: process.env.YOUR_SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 