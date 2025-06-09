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

// Debug: Log all environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'Set' : 'Not Set',
  OPENROUTER_API_KEY_LENGTH: process.env.OPENROUTER_API_KEY?.length
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
    : 'http://localhost:4000')
});

// Configure CORS for production
const allowedOrigins = [
  'https://localllm.onrender.com',
  'https://www.localllm.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost'
];

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Add logging middleware for all requests BEFORE routes
app.use((req, res, next) => {
  console.log('=== Incoming Request ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Base URL:', req.baseUrl);
  console.log('Original URL:', req.originalUrl);
  console.log('Headers:', req.headers);
  console.log('Origin:', req.headers.origin);
  next();
});

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS check for origin:', origin);
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin provided, allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      console.log('Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// Mount API router
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    environment: process.env.NODE_ENV,
    port: PORT,
    hostname: req.hostname,
    origin: req.headers.origin
  });
});

// Chat endpoint
apiRouter.post('/chat', async (req, res) => {
  console.log('Chat request received:', {
    body: req.body,
    headers: req.headers,
    hostname: req.hostname,
    protocol: req.protocol,
    origin: req.headers.origin,
    url: req.originalUrl,
    path: req.path,
    baseUrl: req.baseUrl
  });

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request body:', req.body);
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OpenRouter API key is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Sending request to OpenRouter with messages:', messages);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.BASE_URL || 'https://localllm.onrender.com',
        'X-Title': 'LocalLLM'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        headers: response.headers
      });
      
      // Handle specific error cases
      if (response.status === 401) {
        return res.status(401).json({ error: 'Invalid API key' });
      } else if (response.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      } else if (response.status === 503) {
        return res.status(503).json({ error: 'Service temporarily unavailable' });
      }
      
      return res.status(response.status).json({ 
        error: 'OpenRouter API error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('OpenRouter response data:', data);

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid response from OpenRouter:', data);
      return res.status(500).json({ error: 'Invalid response from OpenRouter' });
    }

    // Match the expected response format
    res.json({
      response: data.choices[0].message.content,
      model: data.model,
      usage: data.usage
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Mount API routes BEFORE static file serving
app.use('/api', apiRouter);

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Add a catch-all route for SPA
app.get('*', (req, res) => {
  // Don't handle API routes here
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  console.log('Serving index.html for path:', req.path);
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Base URL: ${BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://localllm.onrender.com' : 'http://localhost:4000')}`);
});
