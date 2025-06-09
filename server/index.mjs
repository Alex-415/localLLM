import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chatRouter from './routes/api.mjs';

// Load env variables from .env file with explicit path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Configure CORS for production
const allowedOrigins = [
  'https://localllm.onrender.com',
  'https://www.localllm.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost'
];

// Debug: Log all environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  BASE_URL: process.env.BASE_URL,
  TOGETHER_API_KEY: process.env.TOGETHER_API_KEY ? 'Set' : 'Not Set',
  TOGETHER_API_KEY_LENGTH: process.env.TOGETHER_API_KEY?.length,
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not Set',
  VITE_API_URL: process.env.VITE_API_URL
});

const app = express();
const PORT = process.env.PORT || 10000;
const BASE_URL = process.env.BASE_URL || '';

// Debug: Log server startup information
console.log('Server starting with configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  BASE_URL: BASE_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://localllm.onrender.com'
    : 'http://localhost:4000'),
  CORS_ALLOWED_ORIGINS: allowedOrigins
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Add detailed request logging middleware
app.use((req, res, next) => {
  console.log('\n=== Incoming Request ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Base URL:', req.baseUrl);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================\n');
  next();
});

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS check for origin:', origin);
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// Debug: Log available routes
console.log('Available routes:', chatRouter.stack.map(r => ({
  path: r.route?.path,
  methods: r.route?.methods
})));

// Mount API routes BEFORE static file serving
app.use('/api', (req, res, next) => {
  console.log('\n=== API Route Access ===');
  console.log('Time:', new Date().toISOString());
  console.log('Path:', req.path);
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('========================\n');
  next();
}, chatRouter);

// Debug: Log mounted routes
console.log('\n=== Mounted Routes ===');
app._router.stack.forEach(r => {
  if (r.route) {
    console.log(`Route: ${r.route.path}`);
    console.log('Methods:', Object.keys(r.route.methods));
  } else if (r.name === 'router') {
    console.log('Router mounted at:', r.regexp);
    r.handle.stack.forEach(layer => {
      if (layer.route) {
        console.log(`  Route: ${layer.route.path}`);
        console.log('  Methods:', Object.keys(layer.route.methods));
      }
    });
  }
});
console.log('=====================\n');

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Add a catch-all route for SPA
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    console.log('\n=== API Route Not Found ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('========================\n');
    return res.status(404).json({ 
      error: 'API endpoint not found',
      path: req.path,
      method: req.method,
      availableRoutes: chatRouter.stack.map(r => ({
        path: r.route?.path,
        methods: r.route?.methods
      }))
    });
  }
  console.log('Serving index.html for path:', req.path);
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    path: req.path,
    method: req.method
  });
});

// Start the server
app.listen(PORT, () => {
  console.log('\n=== Server Started ===');
  console.log('Time:', new Date().toISOString());
  console.log('Port:', PORT);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Base URL:', process.env.BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://localllm.onrender.com' : 'http://localhost:4000'));
  console.log('=====================\n');
});
