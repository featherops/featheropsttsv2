const fs = require('fs').promises;
const path = require('path');

const VOICES_FILE = path.join(__dirname, '../../data/voices.json');

// Fetch voices directly from PaxSenix API
const fetchVoicesFromAPI = async () => {
  try {
    const axios = require('axios');
    const endpoint = process.env.PAXSENIX_API_ENDPOINT;
    const apiKey = process.env.PAXSENIX_API_KEY;
    
    if (!endpoint || !apiKey) {
      throw new Error('PaxSenix API endpoint or key not configured');
    }
    
    console.log('🔄 Fetching voices from PaxSenix API...');
    
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      params: {
        // Request with an invalid voice to get all available voices
        text: 'test',
        voice: 'invalid-voice-name' // Invalid voice to trigger error response with available_voices
      },
      validateStatus: function (status) {
        // Accept 400 status as it contains the available_voices array
        return status >= 200 && status < 500;
      }
    });
    
    if (response.data && response.data.available_voices) {
      console.log(`✅ Fetched ${response.data.available_voices.length} voices from PaxSenix API`);
      return processVoicesArray(response.data.available_voices);
    } else {
      throw new Error('No available_voices found in API response');
    }
  } catch (error) {
    console.error('❌ Error fetching voices from API:', error.message);
    
    // Fallback: try to load from cached file if API fails
    try {
      const cachedVoices = await fs.readFile(VOICES_FILE, 'utf8');
      const parsed = JSON.parse(cachedVoices);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log(`📦 Using ${parsed.length} cached voices as fallback`);
        return parsed;
      }
    } catch (cacheError) {
      console.error('❌ No cached voices available');
    }
    
    return [];
  }
};

// Process voices array - remove duplicates and add metadata
const processVoicesArray = (voicesArray) => {
  const uniqueVoices = [];
  const seen = new Set();
  
  voicesArray.forEach(voice => {
    const key = `${voice.name}-${voice.language}-${voice.engine}`;
    if (!seen.has(key)) {
      seen.add(key);
      
      // Add additional metadata
      uniqueVoices.push({
        ...voice,
        id: `${voice.name}-${voice.language}-${voice.engine}`,
        category: getVoiceCategory(voice.name, voice.language),
        gender: getVoiceGender(voice.name),
        quality: getVoiceQuality(voice.engine)
      });
    }
  });
  
  return uniqueVoices;
};

// Get voice category based on name and language
const getVoiceCategory = (name, language) => {
  // Celebrity/character voices
  const celebrityVoices = ['mrbeast', 'snoop', 'presidential'];
  if (celebrityVoices.includes(name)) {
    return 'celebrity';
  }
  
  // Language-based categories
  if (language.startsWith('en-')) {
    return 'english';
  } else if (language.startsWith('es-')) {
    return 'spanish';
  } else if (language.startsWith('fr-')) {
    return 'french';
  } else if (language.startsWith('de-')) {
    return 'german';
  } else if (language.startsWith('it-')) {
    return 'italian';
  } else if (language.startsWith('pt-')) {
    return 'portuguese';
  } else if (language.startsWith('ru-')) {
    return 'russian';
  } else if (language.startsWith('ja-')) {
    return 'japanese';
  } else if (language.startsWith('ko-')) {
    return 'korean';
  } else if (language.startsWith('zh-')) {
    return 'chinese';
  } else if (language.startsWith('ar-')) {
    return 'arabic';
  } else if (language.startsWith('hi-')) {
    return 'hindi';
  } else if (language.startsWith('th-')) {
    return 'thai';
  } else if (language.startsWith('vi-')) {
    return 'vietnamese';
  }
  
  return 'other';
};

// Get voice gender (basic estimation based on name)
const getVoiceGender = (name) => {
  const femaleNames = [
    'tasha', 'lisa', 'emily', 'jenny', 'aria', 'joanna', 'mary', 'salli', 'joey',
    'sonia', 'amy', 'libby', 'natasha', 'freya', 'olivia', 'ezinne', 'leah',
    'adri', 'fatima', 'hala', 'rana', 'tanishaa', 'kalina', 'joana', 'xiaoxiao',
    'xiaomeng', 'xiaoyan', 'hiumaan', 'hsiaochen', 'hsiaoyu', 'gabrijela',
    'vlasta', 'christel', 'colette', 'laura', 'dena', 'anu', 'blessica', 'selma',
    'denise', 'celeste', 'sylvie', 'charline', 'ariane', 'katja', 'louisa',
    'vicki', 'eka', 'athina', 'hila', 'swara', 'noemi', 'gudrun', 'gadis',
    'irma', 'elsa', 'palmira', 'imelda', 'bianca', 'mayu', 'nanami', 'shiori',
    'aigul', 'jimin', 'ona', 'everita', 'yasmin', 'hemkala', 'iselin', 'pernille',
    'dilara', 'agnieszka', 'zofia', 'brenda', 'yara', 'leila', 'camila',
    'fernanda', 'ines', 'alina', 'dariya', 'viktoria', 'petra', 'sameera',
    'thilini', 'vera', 'triana', 'carlota', 'larissa', 'hillevi', 'sofie',
    'rehema', 'pallavi', 'saranya', 'kani', 'venba', 'shruti', 'premwadee',
    'emel', 'gul', 'uzma', 'polina', 'hoaimy', 'orla'
  ];
  
  const maleNames = [
    'henry', 'cliff', 'guy', 'jane', 'matthew', 'benwilson', 'kyle', 'kristy',
    'oliver', 'joe', 'george', 'rob', 'russell', 'benjamin', 'nate', 'ryan',
    'michael', 'thomas', 'brian', 'william', 'ken', 'abeo', 'luke', 'willem',
    'hamdan', 'bassel', 'bashkar', 'borislav', 'enric', 'yunfeng', 'yunjian',
    'yunze', 'zhiyu', 'wanlung', 'hiujin', 'yunjhe', 'srecko', 'antonin',
    'jeppe', 'maarten', 'ruben', 'arnaud', 'kert', 'angelo', 'harri', 'henri',
    'claude', 'jean', 'gerard', 'fabrice', 'christoph', 'conrad', 'daniel',
    'giorgi', 'nestoras', 'avri', 'madhur', 'tamas', 'gunnar', 'ardi',
    'benigno', 'gianni', 'diego', 'cataldo', 'adriano', 'naoki', 'daichi',
    'keita', 'daulet', 'injoon', 'bongjin', 'leonas', 'nils', 'osman', 'sagar',
    'finn', 'farid', 'marek', 'donato', 'fabio', 'julio', 'thiago', 'duarte',
    'cristiano', 'emil', 'dmitry', 'lukas', 'rok', 'kumar', 'surya', 'anbu',
    'mohan', 'niwat', 'ahmet', 'salman', 'asad', 'ostap', 'namminh', 'colm'
  ];
  
  if (femaleNames.includes(name.toLowerCase())) {
    return 'female';
  } else if (maleNames.includes(name.toLowerCase())) {
    return 'male';
  }
  
  return 'unknown';
};

// Get voice quality based on engine
const getVoiceQuality = (engine) => {
  switch (engine) {
    case 'neural':
      return 'high';
    case 'azure':
      return 'medium';
    case 'speechify':
      return 'medium';
    case 'resemble':
      return 'high';
    case 'standard':
      return 'basic';
    default:
      return 'medium';
  }
};

// Load all voices with caching and API fallback
const loadAllVoices = async () => {
  try {
    // Check if voices.json exists and is not too old (cache for 1 hour)
    try {
      const stats = await fs.stat(VOICES_FILE);
      const fileAge = Date.now() - stats.mtime.getTime();
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (fileAge < maxAge) {
        const existingVoices = await fs.readFile(VOICES_FILE, 'utf8');
        const parsed = JSON.parse(existingVoices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`📦 Using ${parsed.length} cached voices (age: ${Math.round(fileAge / 1000 / 60)}min)`);
          return parsed;
        }
      }
    } catch {
      // File doesn't exist or is invalid, continue to fetch from API
    }
    
    // Fetch fresh voices from API
    const voices = await fetchVoicesFromAPI();
    
    if (voices.length > 0) {
      // Ensure data directory exists
      const dataDir = path.dirname(VOICES_FILE);
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }
      
      // Save to JSON file for caching
      await fs.writeFile(VOICES_FILE, JSON.stringify(voices, null, 2));
      console.log(`💾 Cached ${voices.length} voices to ${VOICES_FILE}`);
    }
    
    return voices;
  } catch (error) {
    console.error('Error loading voices:', error);
    return [];
  }
};

// Get voices with filters
const getVoices = async (filters = {}) => {
  try {
    const voices = await loadAllVoices();
    
    let filteredVoices = voices;
    
    // Apply filters
    if (filters.language) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.language.toLowerCase().includes(filters.language.toLowerCase())
      );
    }
    
    if (filters.engine) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.engine.toLowerCase() === filters.engine.toLowerCase()
      );
    }
    
    if (filters.gender) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.gender.toLowerCase() === filters.gender.toLowerCase()
      );
    }
    
    if (filters.category) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.category.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredVoices = filteredVoices.filter(voice => 
        voice.name.toLowerCase().includes(searchTerm) ||
        voice.language.toLowerCase().includes(searchTerm) ||
        voice.engine.toLowerCase().includes(searchTerm)
      );
    }
    
    return filteredVoices;
  } catch (error) {
    console.error('Error getting voices:', error);
    return [];
  }
};

// Get voice by ID
const getVoiceById = async (voiceId) => {
  try {
    const voices = await loadAllVoices();
    return voices.find(voice => voice.id === voiceId);
  } catch (error) {
    console.error('Error getting voice by ID:', error);
    return null;
  }
};

// Get voice statistics
const getVoiceStats = async () => {
  try {
    const voices = await loadAllVoices();
    
    const stats = {
      total: voices.length,
      byLanguage: {},
      byEngine: {},
      byGender: {},
      byCategory: {}
    };
    
    voices.forEach(voice => {
      // Language stats
      const lang = voice.language.split('-')[0];
      stats.byLanguage[lang] = (stats.byLanguage[lang] || 0) + 1;
      
      // Engine stats
      stats.byEngine[voice.engine] = (stats.byEngine[voice.engine] || 0) + 1;
      
      // Gender stats
      stats.byGender[voice.gender] = (stats.byGender[voice.gender] || 0) + 1;
      
      // Category stats
      stats.byCategory[voice.category] = (stats.byCategory[voice.category] || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting voice stats:', error);
    return {
      total: 0,
      byLanguage: {},
      byEngine: {},
      byGender: {},
      byCategory: {}
    };
  }
};

// Force refresh voices cache
const refreshVoicesCache = async () => {
  try {
    // Delete existing cache file
    try {
      await fs.unlink(VOICES_FILE);
      console.log('🗑️ Deleted existing voice cache');
    } catch {
      // File doesn't exist, that's fine
    }
    
    // Fetch fresh voices
    const voices = await fetchVoicesFromAPI();
    
    if (voices.length > 0) {
      // Ensure data directory exists
      const dataDir = path.dirname(VOICES_FILE);
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }
      
      // Save to JSON file
      await fs.writeFile(VOICES_FILE, JSON.stringify(voices, null, 2));
      console.log(`💾 Refreshed cache with ${voices.length} voices`);
    }
    
    return voices;
  } catch (error) {
    console.error('Error refreshing voices cache:', error);
    return [];
  }
};

module.exports = {
  loadAllVoices,
  getVoices,
  getVoiceById,
  getVoiceStats,
  fetchVoicesFromAPI,
  refreshVoicesCache
}; 