import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from 'url';

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
const PORT = process.env.PORT || 4000;
const BASE_URL = process.env.BASE_URL || '';

// Debug: Log server startup information
console.log('Server starting with configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://localllm.onrender.com'
    : 'http://localhost:4000'
});

// Configure CORS for production
const allowedOrigins = [
  'https://alex-415.github.io',
  'https://alex-415.github.io/localLLM',
  'http://localhost:5173',
  'http://localhost:4000',
  'http://localhost',
  'https://localllm.onrender.com',
  'https://*.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add OPTIONS handler for preflight requests
app.options('*', cors());

// Parse JSON bodies
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Incoming request:', {
    method: req.method,
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl,
    headers: req.headers,
    body: req.body,
    hostname: req.hostname,
    protocol: req.protocol,
    origin: req.headers.origin
  });
  next();
});

// Create API router
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
    origin: req.headers.origin
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
        'HTTP-Referer': 'https://localllm.onrender.com',
        'X-Title': 'LocalLLM'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: messages
      })
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
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

    res.json({
      message: data.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Mount API routes BEFORE static file serving
app.use('/api', apiRouter);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Handle all other routes by serving the React app
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT,
    BASE_URL,
    CORS_ORIGINS: allowedOrigins
  });
});
