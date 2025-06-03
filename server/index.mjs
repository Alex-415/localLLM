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

// Configure CORS for production
const allowedOrigins = [
  'https://alex-415.github.io',
  'https://alex-415.github.io/localLLM',
  'http://localhost:5173',
  'http://localhost',
  'https://private-llm.onrender.com',
  'https://*.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    env: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      apiKeyPresent: !!process.env.OPENROUTER_API_KEY
    }
  });
});

// Chat endpoint - handle both /api/chat and /chat
app.post(['/api/chat', '/chat'], async (req, res) => {
  try {
    console.log('Received chat request:', {
      headers: req.headers,
      body: req.body,
      url: req.url
    });

    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid request body:', req.body);
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OpenRouter API key is not set');
      return res.status(500).json({ error: 'API key not configured' });
    }

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    console.log('Making request to OpenRouter:', {
      url: openRouterUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]',
        'HTTP-Referer': process.env.NODE_ENV === 'production' 
          ? 'https://private-llm.onrender.com'
          : 'http://localhost:4000',
        'X-Title': 'KML Production'
      }
    });

    console.log('Request body:', { messages });

    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NODE_ENV === 'production' 
          ? 'https://private-llm.onrender.com'
          : 'http://localhost:4000',
        'X-Title': 'KML Production'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: messages
      })
    });

    console.log('OpenRouter response status:', response.status);
    console.log('OpenRouter response headers:', response.headers);

    let responseData;
    const responseText = await response.text();
    console.log('OpenRouter raw response:', responseText);
    
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse OpenRouter response:', {
        status: response.status,
        statusText: response.statusText,
        responseText,
        error: parseError
      });
      return res.status(500).json({ 
        error: 'Invalid response from OpenRouter API',
        details: process.env.NODE_ENV === 'development' ? responseText : undefined
      });
    }

    if (!response.ok) {
      console.error('OpenRouter API error:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData
      });
      return res.status(response.status).json({ 
        error: `OpenRouter API error: ${response.status} ${response.statusText}`,
        details: process.env.NODE_ENV === 'development' ? responseData : undefined
      });
    }

    if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
      console.error('Invalid response format from OpenRouter:', responseData);
      return res.status(500).json({ 
        error: 'Invalid response format from OpenRouter API',
        details: process.env.NODE_ENV === 'development' ? responseData : undefined
      });
    }

    console.log('Successfully processed OpenRouter response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Handle all other routes by serving the React app
app.use((req, res) => {
  res.sendFile(path.join(path.join(__dirname, '..', 'dist'), 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Proxy server running at ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Key: ${process.env.OPENROUTER_API_KEY ? "Set" : "Not Set"}`);
});
