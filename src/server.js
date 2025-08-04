const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api');
const dashboardRoutes = require('./routes/dashboard');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/v1', apiRoutes);

// Dashboard Routes
app.use('/dashboard', dashboardRoutes);

// Serve static files for dashboard
app.use('/dashboard', express.static(path.join(__dirname, '../dashboard/dist'), {
  fallthrough: false,
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache');
  }
}));

// Serve static assets (CSS, JS, images) for the master key route
app.use('/assets', express.static(path.join(__dirname, '../dashboard/dist/assets'), {
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', 'no-cache');
  }
}));



// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: process.env.YOUR_SERVICE_NAME,
    version: process.env.YOUR_SERVICE_VERSION,
    timestamp: new Date().toISOString()
  });
});

// Dashboard access via master key
app.get('/:masterkey', (req, res) => {
  const { masterkey } = req.params;
  const actualMasterKey = process.env.MASTER_KEY;
  
  if (masterkey === actualMasterKey) {
    const dashboardPath = path.join(__dirname, '../dashboard/dist/index.html');
    
    // Check if dashboard file exists
    if (!require('fs').existsSync(dashboardPath)) {
      return res.status(500).json({
        error: {
          message: 'Dashboard not built. Please run: npm run build:client',
          type: 'internal_error',
          status: 500,
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
    
    // Serve the dashboard HTML
    res.sendFile(dashboardPath);
  } else {
    res.status(404).json({
      error: {
        message: 'Invalid master key or endpoint not found',
        type: 'not_found',
        status: 404
      }
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: process.env.YOUR_SERVICE_NAME,
    version: process.env.YOUR_SERVICE_VERSION,
    endpoints: {
      api: '/v1',
      dashboard: `/${process.env.MASTER_KEY}`,
      health: '/health'
    },
    documentation: 'Access dashboard using your master key'
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 ${process.env.YOUR_SERVICE_NAME} server running on port ${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}/${process.env.MASTER_KEY}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/v1`);
  console.log(`💚 Health check at: http://localhost:${PORT}/health`);
}); 