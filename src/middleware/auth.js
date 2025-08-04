const { validateApiKey, getApiKeyInfo } = require('../utils/apiKeyManager');

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'API key required. Use format: Bearer YOUR_API_KEY',
          type: 'authentication_error'
        }
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Validate API key
    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      return res.status(401).json({
        error: {
          message: 'Invalid API key',
          type: 'authentication_error'
        }
      });
    }

    // Get API key info and attach to request
    const keyInfo = await getApiKeyInfo(apiKey);
    req.apiKeyInfo = keyInfo;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      error: {
        message: 'Authentication service error',
        type: 'authentication_error'
      }
    });
  }
};

// Dashboard authentication middleware
const authenticateDashboard = (req, res, next) => {
  const { masterKey } = req.body;
  
  if (!masterKey || masterKey !== process.env.MASTER_KEY) {
    return res.status(401).json({
      error: {
        message: 'Invalid master key',
        type: 'authentication_error'
      }
    });
  }
  
  next();
};

// Dashboard session check middleware
const checkDashboardSession = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token || token !== 'dashboard-access') {
    return res.status(401).json({
      error: {
        message: 'Dashboard access required',
        type: 'authentication_error'
      }
    });
  }
  
  next();
};

module.exports = {
  authenticateApiKey,
  authenticateDashboard,
  checkDashboardSession
}; 