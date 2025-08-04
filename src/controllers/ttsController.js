const axios = require('axios');
const { getVoiceById } = require('../utils/voiceManager');
const { getOriginalKeyForCustomKey, getApiKeyInfo } = require('../utils/apiKeyManager');

// Generate speech using PaxSenix API
const generateSpeech = async (req, res, next) => {
  try {
    console.log('🎵 TTS Request received:', { 
      model: req.body.model, 
      voice: req.body.voice, 
      inputLength: req.body.input?.length,
      response_format: req.body.response_format,
      speed: req.body.speed
    });

    const { model, input, voice, response_format = 'mp3', speed = 1.0 } = req.body;

    // Validate required fields
    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        error: {
          message: 'Input text is required and must be a string',
          type: 'invalid_request_error'
        }
      });
    }

    if (!voice || typeof voice !== 'string') {
      return res.status(400).json({
        error: {
          message: 'Voice is required and must be a string',
          type: 'invalid_request_error'
        }
      });
    }

    // Validate input length
    if (input.length > 4096) {
      return res.status(400).json({
        error: {
          message: 'Input text is too long. Maximum length is 4096 characters.',
          type: 'invalid_request_error'
        }
      });
    }

    console.log('🔍 Looking up voice:', voice);
    // Get voice details - support both full ID format and simple voice name
    let voiceDetails = await getVoiceById(voice);
    
    // If not found by full ID, try to find by voice name only
    if (!voiceDetails) {
      const voices = await require('../utils/voiceManager').getVoices();
      voiceDetails = voices.find(v => v.name === voice);
      
      if (!voiceDetails) {
        return res.status(400).json({
          error: {
            message: `Voice '${voice}' not found. Use /v1/voices to see available voices.`,
            type: 'invalid_request_error'
          }
        });
      }
    }

    console.log('✅ Voice found:', voiceDetails.name);

    // Validate response format
    if (response_format !== 'mp3') {
      return res.status(400).json({
        error: {
          message: 'Only mp3 response format is supported',
          type: 'invalid_request_error'
        }
      });
    }

    // Validate speed
    if (speed < 0.25 || speed > 4.0) {
      return res.status(400).json({
        error: {
          message: 'Speed must be between 0.25 and 4.0',
          type: 'invalid_request_error'
        }
      });
    }

    // Prepare request to PaxSenix API
    const paxsenixRequest = {
      text: input,
      voice: voiceDetails.name,
      language: voiceDetails.language,
      engine: voiceDetails.engine
    };

    console.log('📡 Calling PaxSenix API with:', paxsenixRequest);

    // Get the original API key for this custom key
    const customApiKey = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔑 Custom API key received:', customApiKey ? customApiKey.substring(0, 10) + '...' : 'None');
    
    const customKeyInfo = await getApiKeyInfo(customApiKey);
    console.log('🔑 Custom key info found:', customKeyInfo ? 'Yes' : 'No');
    
    let originalApiKey = process.env.PAXSENIX_API_KEY;
    let originalEndpoint = process.env.PAXSENIX_API_ENDPOINT;
    
    if (customKeyInfo) {
      const originalKey = await getOriginalKeyForCustomKey(customKeyInfo.apiKey);
      if (originalKey) {
        originalApiKey = originalKey.apiKey;
        originalEndpoint = originalKey.endpoint;
        console.log(`🔑 Using original API key: ${originalKey.name}`);
      } else {
        console.log('🔑 No original key mapping found, using default');
      }
    } else {
      console.log('🔑 No custom key info found, using default');
    }

    // Call PaxSenix API
    const paxsenixResponse = await axios.get(originalEndpoint, {
      headers: {
        'Authorization': `Bearer ${originalApiKey}`,
        'Content-Type': 'application/json'
      },
      params: paxsenixRequest,
      timeout: 30000 // 30 seconds timeout
    });

    console.log('✅ PaxSenix response received:', {
      status: paxsenixResponse.status,
      ok: paxsenixResponse.data.ok,
      hasUrl: !!paxsenixResponse.data.url
    });

    // Check if PaxSenix request was successful
    if (!paxsenixResponse.data.ok) {
      return res.status(400).json({
        error: {
          message: paxsenixResponse.data.message || 'TTS generation failed',
          type: 'invalid_request_error'
        }
      });
    }

    // Get audio URL from PaxSenix response
    const audioUrl = paxsenixResponse.data.url;
    if (!audioUrl) {
      return res.status(500).json({
        error: {
          message: 'No audio URL received from TTS service',
          type: 'server_error'
        }
      });
    }

    // Download the audio file
    console.log('📥 Downloading audio from:', audioUrl);
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log('✅ Audio downloaded:', {
      status: audioResponse.status,
      contentType: audioResponse.headers['content-type'],
      dataSize: audioResponse.data.length
    });

    // Set response headers
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioResponse.data.length,
      'Cache-Control': 'public, max-age=3600',
      'X-Voice-Name': voiceDetails.name,
      'X-Voice-Language': voiceDetails.language,
      'X-Voice-Engine': voiceDetails.engine
    });

    console.log('📤 Sending audio response to client...');
    // Send audio data
    res.send(audioResponse.data);
    console.log('✅ Audio response sent successfully');

  } catch (error) {
    console.error('TTS generation error:', error);

    // Handle specific error types
    if (error.response) {
      // PaxSenix API error
      if (error.response.status === 401) {
        return res.status(500).json({
          error: {
            message: 'TTS service authentication failed',
            type: 'server_error'
          }
        });
      } else if (error.response.status === 404) {
        return res.status(400).json({
          error: {
            message: 'Voice not found or not available',
            type: 'invalid_request_error'
          }
        });
      } else if (error.response.status === 429) {
        return res.status(429).json({
          error: {
            message: 'TTS service rate limit exceeded',
            type: 'rate_limit_error'
          }
        });
      } else {
        return res.status(500).json({
          error: {
            message: 'TTS service error',
            type: 'server_error'
          }
        });
      }
    } else if (error.code === 'ECONNABORTED') {
      return res.status(408).json({
        error: {
          message: 'TTS service request timeout',
          type: 'timeout_error'
        }
      });
    } else if (error.code === 'ENOTFOUND') {
      return res.status(503).json({
        error: {
          message: 'TTS service temporarily unavailable',
          type: 'server_error'
        }
      });
    }

    // Generic error
    res.status(500).json({
      error: {
        message: 'Internal server error',
        type: 'server_error'
      }
    });
  }
};

module.exports = {
  generateSpeech
}; 