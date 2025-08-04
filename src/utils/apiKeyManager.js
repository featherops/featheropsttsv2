const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const API_KEYS_FILE = path.join(__dirname, '../../data/api-keys.json');

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = path.dirname(API_KEYS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
};

// Load API keys from file
const loadApiKeys = async () => {
  try {
    await ensureDataDir();
    const data = await fs.readFile(API_KEYS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create default structure
    const defaultData = {
      customKeys: [],
      originalKeys: [],
      keyMappings: {}, // Maps custom keys to original keys
      usage: {}
    };
    await fs.writeFile(API_KEYS_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
};

// Save API keys to file
const saveApiKeys = async (data) => {
  await ensureDataDir();
  await fs.writeFile(API_KEYS_FILE, JSON.stringify(data, null, 2));
};

// Generate a new custom API key
const generateCustomApiKey = () => {
  return `sk-${uuidv4().replace(/-/g, '')}`;
};

// Create a new custom API key
const createCustomApiKey = async (name, rateLimit = 1000, originalKeyId = null) => {
  try {
    const data = await loadApiKeys();
    
    const newKey = {
      id: uuidv4(),
      name,
      apiKey: generateCustomApiKey(),
      status: 'active',
      rateLimit,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      originalKeyId: originalKeyId // Link to original API key
    };
    
    data.customKeys.push(newKey);
    
    // If originalKeyId is provided, create mapping
    if (originalKeyId) {
      data.keyMappings[newKey.apiKey] = originalKeyId;
    }
    
    await saveApiKeys(data);
    
    return newKey;
  } catch (error) {
    console.error('Error creating custom API key:', error);
    throw new Error('Failed to create API key');
  }
};

// Create a new original API key
const createOriginalApiKey = async (name, apiKey, endpoint) => {
  try {
    const data = await loadApiKeys();
    
    const newOriginalKey = {
      id: uuidv4(),
      name,
      apiKey,
      endpoint,
      status: 'active',
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastUsed: null
    };
    
    data.originalKeys.push(newOriginalKey);
    await saveApiKeys(data);
    
    return newOriginalKey;
  } catch (error) {
    console.error('Error creating original API key:', error);
    throw new Error('Failed to create original API key');
  }
};

// Validate API key
const validateApiKey = async (apiKey) => {
  try {
    const data = await loadApiKeys();
    
    const customKey = data.customKeys.find(key => key.apiKey === apiKey);
    if (!customKey || customKey.status !== 'active') {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating API key:', error);
    return false;
  }
};

// Get API key information
const getApiKeyInfo = async (apiKey) => {
  try {
    const data = await loadApiKeys();
    
    console.log('🔍 Looking for API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'None');
    console.log('🔍 Available custom keys:', data.customKeys.map(k => k.apiKey.substring(0, 10) + '...'));
    
    const customKey = data.customKeys.find(key => key.apiKey === apiKey);
    if (!customKey) {
      console.log('🔍 API key not found in custom keys');
      return null;
    }
    
    console.log('🔍 API key found:', customKey.name);
    return customKey;
  } catch (error) {
    console.error('Error getting API key info:', error);
    return null;
  }
};

// Update API key usage
const updateApiKeyUsage = async (apiKey) => {
  try {
    const data = await loadApiKeys();
    
    const customKey = data.customKeys.find(key => key.apiKey === apiKey);
    if (customKey) {
      customKey.usageCount += 1;
      customKey.lastUsed = new Date().toISOString();
      
      // Update usage tracking
      const today = new Date().toISOString().split('T')[0];
      if (!data.usage[today]) {
        data.usage[today] = {};
      }
      if (!data.usage[today][apiKey]) {
        data.usage[today][apiKey] = 0;
      }
      data.usage[today][apiKey] += 1;
      
      await saveApiKeys(data);
    }
  } catch (error) {
    console.error('Error updating API key usage:', error);
  }
};

// Get all custom API keys (masked for display)
const getAllCustomKeys = async () => {
  try {
    const data = await loadApiKeys();
    return data.customKeys.map(key => {
      // Find the original key name if this key is linked to one
      let originalKeyName = null;
      if (key.originalKeyId) {
        const originalKey = data.originalKeys.find(ok => ok.id === key.originalKeyId);
        originalKeyName = originalKey ? originalKey.name : null;
      }
      
      return {
        ...key,
        apiKey: key.apiKey.substring(0, 10) + '...', // Mask the key
        originalKeyName
      };
    });
  } catch (error) {
    console.error('Error getting custom API keys:', error);
    return [];
  }
};

// Get all custom API keys (full keys for playground)
const getAllCustomKeysFull = async () => {
  try {
    const data = await loadApiKeys();
    return data.customKeys.map(key => {
      // Find the original key name if this key is linked to one
      let originalKeyName = null;
      if (key.originalKeyId) {
        const originalKey = data.originalKeys.find(ok => ok.id === key.originalKeyId);
        originalKeyName = originalKey ? originalKey.name : null;
      }
      
      return {
        ...key,
        originalKeyName
      };
    });
  } catch (error) {
    console.error('Error getting custom API keys:', error);
    return [];
  }
};

// Get all original API keys
const getAllOriginalKeys = async () => {
  try {
    const data = await loadApiKeys();
    return data.originalKeys || [];
  } catch (error) {
    console.error('Error getting original API keys:', error);
    return [];
  }
};

// Get original API key for a custom key
const getOriginalKeyForCustomKey = async (customApiKey) => {
  try {
    const data = await loadApiKeys();
    const originalKeyId = data.keyMappings[customApiKey];
    
    if (!originalKeyId) {
      return null;
    }
    
    const originalKey = data.originalKeys.find(key => key.id === originalKeyId);
    return originalKey;
  } catch (error) {
    console.error('Error getting original key for custom key:', error);
    return null;
  }
};

// Update key mapping
const updateKeyMapping = async (customApiKey, originalKeyId) => {
  try {
    const data = await loadApiKeys();
    data.keyMappings[customApiKey] = originalKeyId;
    await saveApiKeys(data);
    return true;
  } catch (error) {
    console.error('Error updating key mapping:', error);
    return false;
  }
};

// Delete custom API key
const deleteCustomApiKey = async (keyId) => {
  try {
    const data = await loadApiKeys();
    
    const keyIndex = data.customKeys.findIndex(key => key.id === keyId);
    if (keyIndex === -1) {
      throw new Error('API key not found');
    }
    
    data.customKeys.splice(keyIndex, 1);
    await saveApiKeys(data);
    
    return true;
  } catch (error) {
    console.error('Error deleting custom API key:', error);
    throw error;
  }
};

// Delete original API key
const deleteOriginalApiKey = async (keyId) => {
  try {
    const data = await loadApiKeys();
    
    const keyIndex = data.originalKeys.findIndex(key => key.id === keyId);
    if (keyIndex === -1) {
      throw new Error('Original API key not found');
    }
    
    // Remove the original key
    data.originalKeys.splice(keyIndex, 1);
    
    // Remove any key mappings that reference this original key
    Object.keys(data.keyMappings).forEach(customKey => {
      if (data.keyMappings[customKey] === keyId) {
        delete data.keyMappings[customKey];
      }
    });
    
    // Update custom keys that were linked to this original key
    data.customKeys.forEach(key => {
      if (key.originalKeyId === keyId) {
        key.originalKeyId = null;
      }
    });
    
    await saveApiKeys(data);
    
    return true;
  } catch (error) {
    console.error('Error deleting original API key:', error);
    throw error;
  }
};

// Get usage statistics
const getUsageStats = async () => {
  try {
    const data = await loadApiKeys();
    return {
      totalKeys: data.customKeys.length,
      activeKeys: data.customKeys.filter(key => key.status === 'active').length,
      totalUsage: data.customKeys.reduce((sum, key) => sum + key.usageCount, 0),
      dailyUsage: data.usage
    };
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      totalKeys: 0,
      activeKeys: 0,
      totalUsage: 0,
      dailyUsage: {}
    };
  }
};

module.exports = {
  createCustomApiKey,
  createOriginalApiKey,
  validateApiKey,
  getApiKeyInfo,
  updateApiKeyUsage,
  getAllCustomKeys,
  getAllCustomKeysFull,
  getAllOriginalKeys,
  getOriginalKeyForCustomKey,
  updateKeyMapping,
  deleteCustomApiKey,
  deleteOriginalApiKey,
  getUsageStats
}; 